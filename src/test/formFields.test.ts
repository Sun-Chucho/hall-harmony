import { describe, expect, it } from 'vitest';
import { formDataToTrimmedFields, trimFieldRecord } from '@/lib/formFields';

describe('form field helpers', () => {
  it('trims form data values and drops blank entries', () => {
    const formData = new FormData();
    formData.append('supplier_name', '  Kuringe Supplies  ');
    formData.append('invoice_number', '  INV-1001 ');
    formData.append('ignored', '   ');

    expect(formDataToTrimmedFields(formData)).toEqual({
      supplier_name: 'Kuringe Supplies',
      invoice_number: 'INV-1001',
    });
  });

  it('trims record values and removes empty fields', () => {
    expect(trimFieldRecord({
      full_name: '  Jane Doe ',
      total_requested: ' 150000 ',
      amount_words: '   ',
    })).toEqual({
      full_name: 'Jane Doe',
      total_requested: '150000',
    });
  });
});
