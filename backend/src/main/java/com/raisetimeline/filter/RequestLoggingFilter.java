package com.raisetimeline.filter;

import com.raisetimeline.entity.User;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter implements Filter {

    // SSE エンドポイントは長時間接続のため完了ログを除外
    private static final String SSE_PATH = "/api/posts/stream";

    @Override
    public void doFilter(ServletRequest servletRequest,
                         ServletResponse servletResponse,
                         FilterChain chain) throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        // フロントから X-Correlation-ID が来た場合はそれを使用（DataLog での突き合わせに対応）
        String correlationId = request.getHeader("X-Correlation-ID");
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }

        long startTime = System.currentTimeMillis();
        String method = request.getMethod();
        String path = request.getRequestURI();
        String queryString = request.getQueryString();
        String clientIp = resolveClientIp(request);

        MDC.put("correlationId", correlationId);
        MDC.put("method", method);
        MDC.put("path", path);
        MDC.put("clientIp", clientIp);

        response.setHeader("X-Correlation-ID", correlationId);

        try {
            chain.doFilter(request, response);
        } finally {
            // Security フィルター実行後に userId を取得
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User user) {
                MDC.put("userId", String.valueOf(user.getId()));
            }

            long durationMs = System.currentTimeMillis() - startTime;
            int status = response.getStatus();

            if (!SSE_PATH.equals(path)) {
                if (status >= 500) {
                    log.error("HTTP {} {}{} {}ms status={}",
                            method, path,
                            queryString != null ? "?" + queryString : "",
                            durationMs, status);
                } else if (status >= 400) {
                    log.warn("HTTP {} {}{} {}ms status={}",
                            method, path,
                            queryString != null ? "?" + queryString : "",
                            durationMs, status);
                } else {
                    log.info("HTTP {} {} {}ms status={}", method, path, durationMs, status);
                }
            }

            // スレッドプール再利用時の MDC 混入を防ぐ
            MDC.clear();
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
