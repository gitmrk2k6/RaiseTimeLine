package com.raisetimeline.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.raisetimeline.dto.PostResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostSseService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final ObjectMapper objectMapper;

    public SseEmitter addEmitter() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        return emitter;
    }

    public void broadcast(PostResponse post) {
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
        String data;
        try {
            data = objectMapper.writeValueAsString(post);
        } catch (Exception e) {
            log.error("Failed to serialize post for SSE broadcast: id={}", post != null ? post.getId() : null, e);
            return;
        }
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("new-post").data(data));
            } catch (Exception e) {
                log.warn("SSE emitter failed, removing: {}", e.getMessage());
                deadEmitters.add(emitter);
            }
        }
        emitters.removeAll(deadEmitters);
    }
}
