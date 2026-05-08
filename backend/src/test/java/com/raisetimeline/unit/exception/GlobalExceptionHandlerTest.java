package com.raisetimeline.unit.exception;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.raisetimeline.exception.DuplicateResourceException;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("GlobalExceptionHandler ログ出力テスト")
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
    private ListAppender<ILoggingEvent> listAppender;
    private Logger handlerLogger;

    @BeforeEach
    void setUpLogger() {
        handlerLogger = (Logger) LoggerFactory.getLogger(GlobalExceptionHandler.class);
        listAppender = new ListAppender<>();
        listAppender.start();
        handlerLogger.addAppender(listAppender);
        handlerLogger.setLevel(Level.DEBUG);
    }

    @AfterEach
    void tearDownLogger() {
        handlerLogger.detachAppender(listAppender);
    }

    @Nested
    @DisplayName("BadCredentialsException")
    class BadCredentialsExceptionTest {

        @Test
        @DisplayName("WARN レベルで記録され、パスワード等の機密情報を含まない")
        void logWarnWithoutCredentials() {
            handler.handleBadCredentials(new BadCredentialsException("bad password"));

            List<ILoggingEvent> logs = listAppender.list;
            assertThat(logs).hasSize(1);
            assertThat(logs.get(0).getLevel()).isEqualTo(Level.WARN);
            // メッセージにパスワードが含まれていないこと
            assertThat(logs.get(0).getFormattedMessage())
                    .doesNotContain("bad password")
                    .doesNotContain("password");
        }
    }

    @Nested
    @DisplayName("DuplicateResourceException")
    class DuplicateResourceExceptionTest {

        @Test
        @DisplayName("WARN レベルでフィールド名とメッセージを記録する")
        void logWarnWithFieldAndMessage() {
            handler.handleDuplicate(new DuplicateResourceException("email", "既に使用されているメールアドレスです"));

            List<ILoggingEvent> logs = listAppender.list;
            assertThat(logs).hasSize(1);
            assertThat(logs.get(0).getLevel()).isEqualTo(Level.WARN);
            assertThat(logs.get(0).getFormattedMessage()).contains("email");
        }
    }

    @Nested
    @DisplayName("ForbiddenException")
    class ForbiddenExceptionTest {

        @Test
        @DisplayName("WARN レベルで記録する")
        void logWarnOnForbidden() {
            handler.handleForbidden(new ForbiddenException("この操作は許可されていません"));

            List<ILoggingEvent> logs = listAppender.list;
            assertThat(logs).hasSize(1);
            assertThat(logs.get(0).getLevel()).isEqualTo(Level.WARN);
        }
    }

    @Nested
    @DisplayName("RuntimeException（未捕捉）")
    class RuntimeExceptionTest {

        @Test
        @DisplayName("ERROR レベルでスタックトレースとともに記録する")
        void logErrorWithStackTrace() {
            RuntimeException cause = new RuntimeException("予期しないエラー");

            handler.handleRuntime(cause);

            List<ILoggingEvent> logs = listAppender.list;
            assertThat(logs).hasSize(1);
            assertThat(logs.get(0).getLevel()).isEqualTo(Level.ERROR);
            // スタックトレース情報が含まれていること
            assertThat(logs.get(0).getThrowableProxy()).isNotNull();
            assertThat(logs.get(0).getThrowableProxy().getMessage()).isEqualTo("予期しないエラー");
        }

        @Test
        @DisplayName("500 レスポンスを返す")
        void return500Response() {
            var response = handler.handleRuntime(new RuntimeException("error"));

            assertThat(response.getStatusCode().value()).isEqualTo(500);
        }
    }
}
