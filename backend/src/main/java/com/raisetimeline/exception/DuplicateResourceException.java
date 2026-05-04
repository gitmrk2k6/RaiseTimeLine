package com.raisetimeline.exception;

import lombok.Getter;

@Getter
public class DuplicateResourceException extends RuntimeException {
    private final String field;

    public DuplicateResourceException(String message, String field) {
        super(message);
        this.field = field;
    }
}
