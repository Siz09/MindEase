/**
 * Utility functions for eSewa payment integration
 */

/**
 * Submits eSewa payment form by creating a hidden form and submitting it
 * @param {string} checkoutUrl - eSewa payment URL
 * @param {Object} formData - Form data object with all required fields
 */
export function submitEsewaForm(checkoutUrl, formData) {
  // Create a form element
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkoutUrl;
  form.style.display = 'none';

  // Add all form fields as hidden inputs
  Object.keys(formData).forEach((key) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = formData[key];
    form.appendChild(input);
  });

  // Append form to body and submit
  document.body.appendChild(form);
  form.submit();
}

/**
 * Decodes Base64 encoded eSewa callback data
 * @param {string} base64Data - Base64 encoded data string
 * @returns {Object} Decoded JSON object
 */
export function decodeEsewaCallback(base64Data) {
  try {
    const decodedString = atob(base64Data);
    return JSON.parse(decodedString);
  } catch (error) {
    console.error('Failed to decode eSewa callback data:', error);
    return null;
  }
}

/**
 * Extracts query parameters from URL
 * @param {string} url - URL string (defaults to window.location.search)
 * @returns {Object} Object with query parameters
 */
export function getQueryParams(url = window.location.search) {
  const params = new URLSearchParams(url);
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}
