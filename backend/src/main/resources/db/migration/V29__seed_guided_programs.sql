-- Seed initial guided programs for English

-- Program 1: Thought Reframing (CBT)
INSERT INTO guided_programs (id, name, description, program_type, language, estimated_duration_minutes, display_order, active)
VALUES
('00000000-0000-0000-0001-000000000001',
 'Thought Reframing',
 'Learn to identify and challenge negative thought patterns using CBT techniques. This exercise helps you develop more balanced, realistic thinking.',
 'cbt',
 'en',
 7,
 1,
 true);

-- Steps for Thought Reframing
INSERT INTO guided_steps (program_id, step_number, title, prompt_text, input_type, input_options)
VALUES
('00000000-0000-0000-0001-000000000001', 1, 'Welcome',
 'Welcome to the Thought Reframing exercise. This technique helps you identify and challenge unhelpful thought patterns. When you''re ready, click Next to continue.',
 'none', NULL),

('00000000-0000-0000-0001-000000000001', 2, 'Identify the Thought',
 'First, let''s identify a negative or unhelpful thought you''ve been having recently. Write it down exactly as it appears in your mind, without judgment.',
 'text', NULL),

('00000000-0000-0000-0001-000000000001', 3, 'Notice the Feeling',
 'What emotion does this thought create? Rate how strongly you feel it right now, from 1 (very mild) to 10 (overwhelming).',
 'scale', '{"min": 1, "max": 10}'),

('00000000-0000-0000-0001-000000000001', 4, 'Challenge the Thought',
 'Now let''s examine this thought. Ask yourself: What evidence do I have that this thought is true? What evidence suggests it might not be completely true? Write your reflections.',
 'text', NULL),

('00000000-0000-0000-0001-000000000001', 5, 'Create an Alternative',
 'Based on your reflection, create a more balanced, realistic thought that takes into account both sides. What would you tell a friend in this situation?',
 'text', NULL),

('00000000-0000-0000-0001-000000000001', 6, 'Re-rate the Feeling',
 'Now, with this new perspective in mind, how strongly do you feel the original emotion? Rate it again from 1 to 10.',
 'scale', '{"min": 1, "max": 10}'),

('00000000-0000-0000-0001-000000000001', 7, 'Reflection',
 'Great work! You''ve completed the thought reframing exercise. Notice how examining your thoughts can shift how you feel. You can return to this exercise whenever you need to challenge unhelpful thinking patterns.',
 'none', NULL);

-- Program 2: 4-7-8 Breathing Technique
INSERT INTO guided_programs (id, name, description, program_type, language, estimated_duration_minutes, display_order, active)
VALUES
('00000000-0000-0000-0002-000000000002',
 '4-7-8 Breathing',
 'A simple breathing technique to calm your nervous system and reduce anxiety. Perfect for moments of stress or before sleep.',
 'breathing',
 'en',
 5,
 2,
 true);

-- Steps for 4-7-8 Breathing
INSERT INTO guided_steps (program_id, step_number, title, prompt_text, input_type, input_options)
VALUES
('00000000-0000-0000-0002-000000000002', 1, 'Preparation',
 'Find a comfortable position, either sitting or lying down. Place one hand on your chest and the other on your belly. We''ll do four cycles of 4-7-8 breathing together. Ready?',
'none', NULL),

('00000000-0000-0000-0002-000000000002', 2, 'First Cycle',
 'Breathe in through your nose for 4 counts... Hold for 7 counts... Exhale through your mouth for 8 counts. Great! Click Next when you''ve completed this cycle.',
'none', NULL),

('00000000-0000-0000-0002-000000000002', 3, 'Continue',
 'Let''s do three more cycles together. Remember: In for 4, hold for 7, out for 8. Take your time and focus on the rhythm. Click Next when you''ve completed all three cycles.',
'none', NULL),

('00000000-0000-0000-0002-000000000002', 4, 'How Do You Feel?',
 'You''ve completed the 4-7-8 breathing exercise! How do you feel now compared to when you started?',
 'choice', '{"options": ["More calm", "About the same", "Still anxious"]}'),

('00000000-0000-0000-0002-000000000002', 5, 'Completion',
 'Excellent work! The 4-7-8 breathing technique can be used anytime you need to calm down. With practice, it becomes even more effective. You can do this exercise throughout your day whenever you need it.',
'none', NULL);

-- Program 3: 5-4-3-2-1 Grounding Technique
INSERT INTO guided_programs (id, name, description, program_type, language, estimated_duration_minutes, display_order, active)
VALUES
('00000000-0000-0000-0003-000000000003',
 '5-4-3-2-1 Grounding',
 'Use your five senses to bring yourself into the present moment. This technique is helpful for anxiety, panic, or feeling overwhelmed.',
 'grounding',
 'en',
 6,
 3,
 true);

-- Steps for 5-4-3-2-1 Grounding
INSERT INTO guided_steps (program_id, step_number, title, prompt_text, input_type, input_options)
VALUES
('00000000-0000-0000-0003-000000000003', 1, 'Introduction',
 'The 5-4-3-2-1 technique uses your five senses to ground you in the present moment. Take a deep breath, and let''s begin.',
'none', NULL),

('00000000-0000-0000-0003-000000000003', 2, '5 Things You See',
 'Look around you. Name 5 things you can see right now. They can be anything - a color, an object, a texture. Write them down, separated by commas.',
'text', NULL),

('00000000-0000-0000-0003-000000000003', 3, '4 Things You Feel',
 'Now notice 4 things you can physically feel. Maybe it''s your feet on the floor, the chair supporting you, the temperature of the air, or the texture of your clothing. List them here.',
'text', NULL),

('00000000-0000-0000-0003-000000000003', 4, '3 Things You Hear',
 'Pause and listen. What are 3 things you can hear? They can be nearby or distant - traffic, voices, your own breathing, a ticking clock. List them.',
'text', NULL),

('00000000-0000-0000-0003-000000000003', 5, '2 Things You Smell',
 'What can you smell? If you can''t smell anything right now, think of 2 of your favorite scents. Write them down.',
'text', NULL),

('00000000-0000-0000-0003-000000000003', 6, '1 Thing You Taste',
 'Finally, notice one thing you can taste. Or think of your favorite taste if you can''t taste anything right now.',
'text', NULL),

('00000000-0000-0000-0003-000000000003', 7, 'Completion',
 'Wonderful! You''ve completed the 5-4-3-2-1 grounding exercise. Notice how you feel now - more present, more grounded. You can use this technique anytime you feel anxious or overwhelmed.',
'none', NULL);

-- Program 4: Nepali - श्वास व्यायाम (Breathing Exercise)
INSERT INTO guided_programs (id, name, description, program_type, language, estimated_duration_minutes, display_order, active)
VALUES
('00000000-0000-0000-0004-000000000004',
 'श्वास व्यायाम',
 'तनाव र चिन्ता कम गर्न सरल श्वास प्रश्वास व्यायाम। यो तपाईंको स्नायु प्रणाली शान्त गर्न मद्दत गर्दछ।',
 'breathing',
 'ne',
 5,
 1,
 true);

-- Steps for Nepali Breathing Exercise
INSERT INTO guided_steps (program_id, step_number, title, prompt_text, input_type, input_options)
VALUES
('00000000-0000-0000-0004-000000000004', 1, 'तयारी',
 'आरामदायक स्थितिमा बस्नुहोस् वा सुत्नुहोस्। हामी सँगै ४ पटक श्वास प्रश्वास गर्नेछौं। तयार हुनुहुन्छ?',
'none', NULL),

('00000000-0000-0000-0004-000000000004', 2, 'पहिलो चक्र',
 '४ सम्म गन्दै नाकबाट सास लिनुहोस्... ७ सम्म रोक्नुहोस्... ८ सम्म गन्दै मुखबाट बाहिर निकाल्नुहोस्। राम्रो! यो चक्र पूरा भएपछि Next थिच्नुहोस्।',
'none', NULL),

('00000000-0000-0000-0004-000000000004', 3, 'जारी राख्नुहोस्',
 'अब हामी तीन चक्र थप गर्नेछौं। याद गर्नुहोस्: ४ मा भित्र, ७ मा रोक्नुहोस्, ८ मा बाहिर। आफ्नो समय लिनुहोस्। तीनवटै चक्र पूरा भएपछि Next थिच्नुहोस्।',
'none', NULL),

('00000000-0000-0000-0004-000000000004', 4, 'तपाईं कस्तो महसुस गर्नुहुन्छ?',
 'तपाईंले श्वास व्यायाम पूरा गर्नुभयो! अब तपाईं सुरुमा भन्दा कस्तो महसुस गर्नुहुन्छ?',
 'choice', '{"options": ["धेरै शान्त", "उस्तै", "अझै चिन्तित"]}'),

('00000000-0000-0000-0004-000000000004', 5, 'समाप्ति',
 'उत्कृष्ट! यो श्वास प्रश्वास व्यायाम तपाईंले जहिले पनि शान्त हुन आवश्यक पर्दा प्रयोग गर्न सक्नुहुन्छ। अभ्यासले यो अझ प्रभावकारी हुन्छ।',
'none', NULL);

-- Program 5: Progressive Muscle Relaxation
INSERT INTO guided_programs (id, name, description, program_type, language, estimated_duration_minutes, display_order, active)
VALUES
('00000000-0000-0000-0005-000000000005',
 'Muscle Relaxation',
 'Learn to release physical tension through systematic tensing and relaxing of muscle groups. Great for stress and sleep.',
 'relaxation',
 'en',
 10,
 4,
 true);

-- Steps for Progressive Muscle Relaxation
INSERT INTO guided_steps (program_id, step_number, title, prompt_text, input_type, input_options)
VALUES
('00000000-0000-0000-0005-000000000005', 1, 'Getting Ready',
 'Find a quiet space where you can sit or lie down comfortably. We''ll work through different muscle groups, tensing and then relaxing them. This helps release physical tension you might not even notice you''re holding.',
'none', NULL),

('00000000-0000-0000-0005-000000000005', 2, 'Hands and Arms',
 'Make tight fists with both hands and tense your arms... Hold for 5 seconds... Now release and notice the difference. Feel the relaxation flowing through your hands and arms. Click Next when ready.',
'none', NULL),

('00000000-0000-0000-0005-000000000005', 3, 'Shoulders',
 'Raise your shoulders up toward your ears... Hold the tension... Now let them drop. Feel the release as your shoulders relax downward.',
'none', NULL),

('00000000-0000-0000-0005-000000000005', 4, 'Face and Jaw',
 'Scrunch up your face - forehead, eyes, jaw... Hold it... Now release everything. Let your jaw drop slightly and feel your face soften.',
'none', NULL),

('00000000-0000-0000-0005-000000000005', 5, 'Final Check',
 'Take a moment to scan your body. Notice any remaining tension. Breathe into those areas and let them soften. How relaxed do you feel now?',
 'scale', '{"min": 1, "max": 10}'),

('00000000-0000-0000-0005-000000000005', 6, 'Completion',
 'Excellent! You''ve learned progressive muscle relaxation. Use this technique whenever you notice physical tension, before bed, or during stressful moments. With practice, you''ll be able to relax your body more quickly.',
'none', NULL);
