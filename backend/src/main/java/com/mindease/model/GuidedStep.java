package com.mindease.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Map;

@Entity
@Table(name = "guided_steps")
public class GuidedStep {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "program_id", nullable = false)
    private UUID programId;

    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    private String title;

    @Column(name = "prompt_text", nullable = false, columnDefinition = "TEXT")
    private String promptText;

    @Column(name = "input_type", nullable = false)
    private String inputType; // 'text', 'choice', 'scale', 'none'

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "input_options", columnDefinition = "jsonb")
    private Map<String, Object> inputOptions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "next_step_logic", columnDefinition = "jsonb")
    private Map<String, Object> nextStepLogic;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public GuidedStep() {
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getProgramId() {
        return programId;
    }

    public void setProgramId(UUID programId) {
        this.programId = programId;
    }

    public Integer getStepNumber() {
        return stepNumber;
    }

    public void setStepNumber(Integer stepNumber) {
        this.stepNumber = stepNumber;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getPromptText() {
        return promptText;
    }

    public void setPromptText(String promptText) {
        this.promptText = promptText;
    }

    public String getInputType() {
        return inputType;
    }

    public void setInputType(String inputType) {
        this.inputType = inputType;
    }

    public Map<String, Object> getInputOptions() {
        return inputOptions;
    }

    public void setInputOptions(Map<String, Object> inputOptions) {
        this.inputOptions = inputOptions;
    }

    public Map<String, Object> getNextStepLogic() {
        return nextStepLogic;
    }

    public void setNextStepLogic(Map<String, Object> nextStepLogic) {
        this.nextStepLogic = nextStepLogic;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
