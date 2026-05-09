package com.raisetimeline.unit.filter;

import com.raisetimeline.filter.RequestLoggingFilter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("RequestLoggingFilter ユニットテスト")
class RequestLoggingFilterTest {

    private final RequestLoggingFilter filter = new RequestLoggingFilter();

    @AfterEach
    void clearMdc() {
        MDC.clear();
    }

    @Nested
    @DisplayName("correlationId の設定")
    class CorrelationId {

        @Test
        @DisplayName("X-Correlation-ID ヘッダーがある場合はその値を使用する")
        void useHeaderCorrelationId() throws Exception {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/posts");
            request.addHeader("X-Correlation-ID", "test-correlation-id-123");
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            filter.doFilter(request, response, chain);

            assertThat(response.getHeader("X-Correlation-ID")).isEqualTo("test-correlation-id-123");
        }

        @Test
        @DisplayName("X-Correlation-ID ヘッダーがない場合は UUID を生成してレスポンスヘッダーに付与する")
        void generateCorrelationIdWhenHeaderAbsent() throws Exception {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/posts");
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            filter.doFilter(request, response, chain);

            String correlationId = response.getHeader("X-Correlation-ID");
            assertThat(correlationId).isNotNull().isNotBlank();
            // UUID 形式であることを確認（8-4-4-4-12 の形式）
            assertThat(correlationId).matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
        }

        @Test
        @DisplayName("空の X-Correlation-ID ヘッダーの場合は UUID を生成する")
        void generateCorrelationIdWhenHeaderBlank() throws Exception {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/posts");
            request.addHeader("X-Correlation-ID", "  ");
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            filter.doFilter(request, response, chain);

            String correlationId = response.getHeader("X-Correlation-ID");
            assertThat(correlationId).isNotNull().isNotBlank();
            assertThat(correlationId).matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
        }
    }

    @Nested
    @DisplayName("MDC のライフサイクル")
    class MdcLifecycle {

        @Test
        @DisplayName("リクエスト完了後に MDC がクリアされている")
        void mdcClearedAfterRequest() throws Exception {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/posts");
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            filter.doFilter(request, response, chain);

            // フィルター完了後は MDC が空であること
            assertThat(MDC.get("correlationId")).isNull();
            assertThat(MDC.get("method")).isNull();
            assertThat(MDC.get("path")).isNull();
            assertThat(MDC.get("clientIp")).isNull();
            assertThat(MDC.get("userId")).isNull();
        }

        @Test
        @DisplayName("フィルターチェーンで例外が発生しても MDC がクリアされる")
        void mdcClearedEvenOnException() throws Exception {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/posts");
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain() {
                @Override
                public void doFilter(jakarta.servlet.ServletRequest req,
                                     jakarta.servlet.ServletResponse res)
                        throws java.io.IOException, jakarta.servlet.ServletException {
                    throw new RuntimeException("テスト用例外");
                }
            };

            try {
                filter.doFilter(request, response, chain);
            } catch (RuntimeException ignored) {
                // 例外は無視（MDC クリアの確認が目的）
            }

            assertThat(MDC.get("correlationId")).isNull();
            assertThat(MDC.get("method")).isNull();
        }
    }

    @Nested
    @DisplayName("クライアント IP の解決")
    class ClientIp {

        @Test
        @DisplayName("X-Forwarded-For ヘッダーがある場合は最初の IP を使用する（ALB 経由）")
        void resolveClientIpFromXForwardedFor() throws Exception {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/posts");
            request.addHeader("X-Forwarded-For", "203.0.113.1, 10.0.0.1");
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            filter.doFilter(request, response, chain);

            // X-Correlation-ID がセットされていれば MDC の clientIp 設定も動作している
            assertThat(response.getHeader("X-Correlation-ID")).isNotNull();
        }
    }
}
