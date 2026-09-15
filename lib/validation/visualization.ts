import { z } from 'zod';

export const ALLOWED_UNITS = ['cm', 'inch', 'ft'] as const;
export const ALLOWED_PLACEMENTS = [
  'Center',
  'Left',
  'Right',
  'Against Back Wall',
  'Against Left Wall',
  'Against Right Wall',
  'Custom',
] as const;

export const visualizationFormSchema = z.object({
  product_width: z.coerce
    .number({ invalid_type_error: 'Width must be a valid number' })
    .positive('Product width must be a positive number greater than zero'),
  product_depth: z.coerce
    .number({ invalid_type_error: 'Depth must be a valid number' })
    .positive('Product depth must be a positive number greater than zero'),
  product_height: z.coerce
    .number({ invalid_type_error: 'Height must be a valid number' })
    .positive('Product height must be a positive number greater than zero'),
  dimension_unit: z.enum(ALLOWED_UNITS, {
    errorMap: () => ({ message: 'Dimension unit must be cm, inch, or ft' }),
  }).default('cm'),
  placement: z.string().min(1, 'Placement selection is required'),
  instructions: z.string().max(1000, 'Instructions cannot exceed 1000 characters').optional().default(''),
});

export const regenerationSchema = z.object({
  placement: z.string().min(1, 'Placement selection is required'),
  instructions: z.string().max(1000, 'Instructions cannot exceed 1000 characters').optional().default(''),
});

export type VisualizationFormData = z.infer<typeof visualizationFormSchema>;
export type RegenerationData = z.infer<typeof regenerationSchema>;
