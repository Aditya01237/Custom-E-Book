package com.example.ebook.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiChunkingService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public record ChapterInfo(String title, int startPage, int endPage, String startTime, String endTime) {}

    public List<ChapterInfo> extractChaptersFromText(String extractText, int totalPages) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            System.err.println("Gemini API key is not configured. Falling back to default logical split.");
            return defaultPdfSplit(totalPages);
        }

        try {
            String prompt = "You are a helpful assistant. I will provide text from a PDF document. " +
                    "Your task is to identify chapter titles and the pages they start on. " +
                    "Respond with a JSON array where each object has 'title' (string), 'startPage' (integer), and 'endPage' (integer). " +
                    "If you cannot determine chapters, return an empty array. " +
                    "Here is the text snippet (might be partial):\n\n" + extractText;

            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;
            
            Map<String, Object> requestBody = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> content = new HashMap<>();
            Map<String, Object> parts = new HashMap<>();
            parts.put("text", prompt);
            content.put("parts", List.of(parts));
            contents.add(content);
            requestBody.put("contents", contents);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String response = restTemplate.postForObject(url, entity, String.class);
            
            // Extract JSON from response
            JsonNode root = objectMapper.readTree(response);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode partsNode = candidates.get(0).path("content").path("parts");
                if (partsNode.isArray() && partsNode.size() > 0) {
                    String rawText = partsNode.get(0).path("text").asText();
                    return parseJsonArrayResponse(rawText, totalPages);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to call Gemini API: " + e.getMessage());
        }
        
        return defaultPdfSplit(totalPages);
    }
    
    private List<ChapterInfo> parseJsonArrayResponse(String rawText, int totalPages) {
        List<ChapterInfo> chapters = new ArrayList<>();
        try {
            // strip markdown formatting if any
            String jsonStr = rawText.replaceAll("```json", "").replaceAll("```", "").trim();
            JsonNode arrayNode = objectMapper.readTree(jsonStr);
            if (arrayNode.isArray()) {
                for (JsonNode node : arrayNode) {
                    String title = node.path("title").asText("Untitled Chapter");
                    int startPage = node.path("startPage").asInt(1);
                    int endPage = node.path("endPage").asInt(totalPages);
                    chapters.add(new ChapterInfo(title, startPage, endPage, null, null));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        if (chapters.isEmpty()) {
            return defaultPdfSplit(totalPages);
        }
        return chapters;
    }

    private List<ChapterInfo> defaultPdfSplit(int totalPages) {
        List<ChapterInfo> chunks = new ArrayList<>();
        int interval = Math.max(1, totalPages / 5); // Split into ~5 chunks implicitly
        int currentStart = 1;
        int chunkIdx = 1;
        while (currentStart <= totalPages) {
            int end = Math.min(currentStart + interval - 1, totalPages);
            chunks.add(new ChapterInfo("Part " + chunkIdx, currentStart, end, null, null));
            currentStart = end + 1;
            chunkIdx++;
        }
        return chunks;
    }
}
