// Color picker utility for conversation settings
// This provides a simple color input that can be used in settings dialogs

export interface ColorPickerOptions {
  defaultColor?: string;
  onChange?: (color: string) => void;
}

/**
 * Creates a color picker input element
 * @param options Configuration options for the color picker
 * @returns HTMLInputElement configured as a color picker
 */
export function createColorPicker(options: ColorPickerOptions = {}): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "color";
  input.value = options.defaultColor || "#6366f1";

  if (options.onChange) {
    input.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      options.onChange!(target.value);
    });
  }

  return input;
}

/**
 * Utility function to convert hex color to RGB
 * @param hex Hex color string (e.g., "#ff0000")
 * @returns RGB object or null if invalid
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Utility function to convert RGB to hex
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @returns Hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
