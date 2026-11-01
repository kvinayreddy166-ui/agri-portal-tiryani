import { describe, expect, it } from 'vitest';
import { classifyPublicForm, getPublicFormWorkflowRank } from './PublicOfficerTools';
import { FormDownload } from '../../../shared/types/database';

function createMockForm(title: string, description = '', category = 'pesticides'): FormDownload {
  return {
    id: 'test-id',
    title,
    description,
    file_url: 'https://example.com/test.pdf',
    file_type: 'pdf',
    category,
    created_at: new Date().toISOString(),
  };
}

describe('classifyPublicForm', () => {
  it('classifies "Pesticides for control of Desert Locust" as reference material', () => {
    const form = createMockForm('Pesticides for control of Desert Locust');
    expect(classifyPublicForm(form)).toBe('reference');
  });

  it('classifies "Pesticides for Public Health/House Hold" as reference material', () => {
    const form = createMockForm('Pesticides for Public Health/House Hold');
    expect(classifyPublicForm(form)).toBe('reference');
  });

  it('classifies "Biostimulants" as reference material', () => {
    const form = createMockForm('Biostimulants', '', 'fertilizers');
    expect(classifyPublicForm(form)).toBe('reference');
  });

  it('classifies statutory and sampling forms correctly', () => {
    expect(classifyPublicForm(createMockForm('Form V(C)'))).toBe('sampling');
    expect(classifyPublicForm(createMockForm('FORM II', '', 'seed'))).toBe('sampling');
    expect(classifyPublicForm(createMockForm('FORM J', '', 'fertilizers'))).toBe('sampling');
  });

  it('classifies enforcement orders correctly', () => {
    expect(classifyPublicForm(createMockForm('Form VA(Stop sale)'))).toBe('enforcement');
    expect(classifyPublicForm(createMockForm('Form V-B(seizure)'))).toBe('enforcement');
    expect(classifyPublicForm(createMockForm('PANCHANAMA', '', 'fertilizers'))).toBe('enforcement');
  });

  it('assigns appropriate ranking for reference items', () => {
    const locust = createMockForm('Pesticides for control of Desert Locust');
    const publicHealth = createMockForm('Pesticides for Public Health/House Hold');
    expect(getPublicFormWorkflowRank(locust)).toBe(362);
    expect(getPublicFormWorkflowRank(publicHealth)).toBe(364);
  });
});
