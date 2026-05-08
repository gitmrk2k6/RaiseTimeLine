package com.raisetimeline.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Actuator ヘルスエンドポイント統合テスト
 *
 * 検証スコープ: HTTP → SecurityFilterChain（permitAll 設定） → Actuator
 *
 * ALB ヘルスチェックが認証なしで疎通できることを保証する。
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Actuator ヘルスエンドポイント統合テスト")
class ActuatorHealthIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    @DisplayName("認証なしで /actuator/health が 200 を返す（ALB ヘルスチェック用）")
    void healthEndpointAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("認証なしで /actuator/health/liveness が 200 を返す")
    void livenessEndpointAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("認証なしで /actuator/health/readiness が 200 を返す（ALB ヘルスチェックパス）")
    void readinessEndpointAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/actuator/health/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("リクエストに X-Correlation-ID ヘッダーを付けるとレスポンスにも返ってくる")
    void correlationIdPropagated() throws Exception {
        mockMvc.perform(get("/actuator/health")
                        .header("X-Correlation-ID", "test-id-12345"))
                .andExpect(status().isOk())
                .andExpect(result ->
                        org.assertj.core.api.Assertions.assertThat(
                                result.getResponse().getHeader("X-Correlation-ID")
                        ).isEqualTo("test-id-12345"));
    }
}
