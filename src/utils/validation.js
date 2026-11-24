/**
 * Utilidades centralizadas de sanitización en tiempo real y validación de campos para SGUMS.
 *
 * Reglas generales acordadas:
 * - Nombres y Apellidos: Solo letras y espacios | Mín: 2, Máx: 30 caracteres.
 * - Cédula (V/E): Solo números | Mín: 6, Máx: 10 dígitos (Pasaporte P: alfanumérico 6–15).
 * - Teléfono: Solo números | 10 a 11 dígitos.
 * - Correo electrónico: Formato válido | Máx: 100 caracteres.
 * - Códigos (Carrera, Materia, Sección, Aula): Alfanumérico + guión (A-Z, 0-9, -) en mayúsculas | Máx: 15 caracteres.
 * - Nombres descriptivos (Carreras, Materias, Aulas, Pensum): Letras, números y signos básicos | Mín: 3, Máx: 100 caracteres.
 * - Semestres / Trimestres por carrera:
 *   - Semestral: 8 o 12 semestres.
 *   - Trimestral: 12 trimestres.
 * - Unidades de crédito: Solo números enteros (1 a 10).
 * - Cupos / Capacidad de aula o sección: Solo números enteros (1 a 100).
 * - Calificaciones / Notas: Solo números de 0 a 20 (con soporte decimal).
 */

export const LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 30,
  DOC_MIN: 6,
  DOC_MAX: 10,
  PASSPORT_MAX: 15,
  PHONE_MIN: 10,
  PHONE_MAX: 11,
  EMAIL_MAX: 100,
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
  CODE_MIN: 2,
  CODE_MAX: 15,
  CAREER_NAME_MAX: 50,
  TITLE_MIN: 3,
  TITLE_MAX: 100,
  BUILDING_MAX: 60,
  PERIOD_NAME_MIN: 3,
  PERIOD_NAME_MAX: 20,
  CREDITS_MIN: 1,
  CREDITS_MAX: 10,
  CAPACITY_MIN: 1,
  CAPACITY_MAX: 100,
  GRADE_MIN: 0,
  GRADE_MAX: 20,
  ADDRESS_MIN: 5,
  ADDRESS_MAX: 160,
  RESOURCES_MAX: 200,
  NOTES_MAX: 300,
  CONTENT_MAX: 120,
  MIN_AGE: 17
};

const LETTERS_ONLY_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_REGEX = /^[A-Z0-9-]+$/;

/**
 * Permite únicamente letras (incluyendo acentos y ñ) y espacios.
 * Limita la longitud máxima (por defecto 30).
 */
export function sanitizeLettersOnly(value = '', maxLength = LIMITS.NAME_MAX) {
  return String(value)
    .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLength);
}

/**
 * Permite únicamente dígitos numéricos (0-9).
 * Limita la longitud máxima.
 */
export function sanitizeDigitsOnly(value = '', maxLength = LIMITS.DOC_MAX) {
  return String(value)
    .replace(/\D/g, '')
    .slice(0, maxLength);
}

/**
 * Sanitiza número de documento según el tipo:
 * - V / E: Solo números (máx 10 dígitos)
 * - P (Pasaporte): Alfanumérico en mayúsculas (máx 15 caracteres)
 */
export function sanitizeDocumentNumber(value = '', docType = 'V') {
  if (String(docType).toUpperCase() === 'P') {
    return String(value)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, LIMITS.PASSPORT_MAX);
  }
  return sanitizeDigitsOnly(value, LIMITS.DOC_MAX);
}

/**
 * Sanitiza códigos institucionales (Carrera, Materia, Aula, etc.):
 * Convierte a mayúsculas y permite solo A-Z, 0-9 y guión (-), hasta 15 caracteres.
 */
export function sanitizeCode(value = '', maxLength = LIMITS.CODE_MAX) {
  return String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, maxLength);
}

/**
 * Sanitiza nombres descriptivos (Carreras, Materias, Pensums, Aulas, Edificios):
 * Permite letras, números, espacios y puntuación básica (.,()-/).
 */
export function sanitizeTitleText(value = '', maxLength = LIMITS.TITLE_MAX) {
  return String(value)
    .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,()\-/]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLength);
}

/**
 * Sanitiza el nombre de un período académico (ej: 2026-I, 2027-T1):
 * Permite letras, números, guiones y espacios hasta 20 caracteres.
 */
export function sanitizePeriodName(value = '', maxLength = LIMITS.PERIOD_NAME_MAX) {
  return String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9-\s]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLength);
}

/**
 * Sanitiza nombre de usuario (username):
 * Sin espacios, solo letras, números y (._-), máx 30 caracteres.
 */
export function sanitizeUsername(value = '', maxLength = LIMITS.USERNAME_MAX) {
  return String(value)
    .replace(/[^A-Za-z0-9._-]/g, '')
    .slice(0, maxLength);
}

/**
 * Sanitiza correo electrónico:
 * Elimina espacios en blanco y limita a 100 caracteres.
 */
export function sanitizeEmail(value = '', maxLength = LIMITS.EMAIL_MAX) {
  return String(value)
    .replace(/\s/g, '')
    .slice(0, maxLength);
}

/**
 * Sanitiza un número entero positivo dentro de un rango (ej: créditos 1-10, cupos 1-100).
 * Si el usuario borra el campo temporalmente mientras escribe, permite cadena vacía ''.
 */
export function sanitizeIntRange(value = '', min = 1, max = 100) {
  const digits = String(value).replace(/\D/g, '');
  if (digits === '') return '';
  const num = parseInt(digits, 10);
  if (Number.isNaN(num)) return '';
  if (num > max) return String(max);
  return String(num);
}

/**
 * Sanitiza una calificación / nota en tiempo real (escala 0 a 20, hasta 1 o 2 decimales).
 */
export function sanitizeGradeInput(value = '') {
  if (value === '' || value === null || value === undefined) return '';
  // Reemplazar coma por punto y eliminar todo lo que no sea dígito o punto
  let cleaned = String(value).replace(/,/g, '.').replace(/[^0-9.]/g, '');
  if (!cleaned) return '';

  // Permitir solo un punto decimal
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
  }

  // Limitar decimales a máximo 2 dígitos
  const [intPart, decPart] = cleaned.split('.');
  if (decPart !== undefined) {
    cleaned = `${intPart}.${decPart.slice(0, 2)}`;
  }

  const numeric = Number(cleaned);
  if (!Number.isFinite(numeric)) return '';
  if (numeric > LIMITS.GRADE_MAX) return String(LIMITS.GRADE_MAX);
  if (numeric < LIMITS.GRADE_MIN) return String(LIMITS.GRADE_MIN);

  return cleaned;
}

/**
 * Validaciones puntuales con mensaje de error (devuelven string vacío '' si es válido)
 */
export function validatePersonName(value = '', label = 'El nombre', required = true) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return required ? `${label} es obligatorio.` : '';
  }
  if (trimmed.length < LIMITS.NAME_MIN || trimmed.length > LIMITS.NAME_MAX) {
    return `${label} debe tener entre ${LIMITS.NAME_MIN} y ${LIMITS.NAME_MAX} letras.`;
  }
  if (!LETTERS_ONLY_REGEX.test(trimmed)) {
    return `${label} solo puede contener letras y espacios.`;
  }
  return '';
}

export function validateEmailField(value = '', required = true) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return required ? 'El correo electrónico es obligatorio.' : '';
  }
  if (trimmed.length > LIMITS.EMAIL_MAX) {
    return `El correo no puede exceder ${LIMITS.EMAIL_MAX} caracteres.`;
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'El correo electrónico no tiene un formato válido.';
  }
  return '';
}

export function validateDocumentField(value = '', docType = 'V') {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return 'El número de documento / cédula es obligatorio.';
  }
  if (String(docType).toUpperCase() === 'P') {
    if (!/^[A-Z0-9]{6,15}$/i.test(trimmed)) {
      return 'El pasaporte debe contener entre 6 y 15 caracteres alfanuméricos.';
    }
    return '';
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < LIMITS.DOC_MIN || digits.length > LIMITS.DOC_MAX) {
    return `La cédula debe contener solo números y tener entre ${LIMITS.DOC_MIN} y ${LIMITS.DOC_MAX} dígitos.`;
  }
  return '';
}

export function validatePhoneField(value = '', required = true) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) {
    return required ? 'El número de teléfono es obligatorio.' : '';
  }
  if (digits.length < LIMITS.PHONE_MIN || digits.length > LIMITS.PHONE_MAX) {
    return `El teléfono debe contener solo números y tener entre ${LIMITS.PHONE_MIN} y ${LIMITS.PHONE_MAX} dígitos.`;
  }
  return '';
}

export function validateCodeField(value = '', label = 'El código') {
  const trimmed = String(value || '').trim().toUpperCase();
  if (!trimmed) {
    return `${label} es obligatorio.`;
  }
  if (trimmed.length < LIMITS.CODE_MIN || trimmed.length > LIMITS.CODE_MAX) {
    return `${label} debe tener entre ${LIMITS.CODE_MIN} y ${LIMITS.CODE_MAX} caracteres.`;
  }
  if (!CODE_REGEX.test(trimmed)) {
    return `${label} solo permite letras, números y guiones (ej: ING-SIS).`;
  }
  return '';
}

export function validateCareerTerms(totalTerms, regime = 'Semestral') {
  const num = Number(totalTerms);
  if (!Number.isInteger(num)) {
    return 'La duración debe ser un número entero válido.';
  }
  if (regime === 'Trimestral') {
    if (num !== 12) {
      return 'Para carreras trimestrales la duración debe ser de 12 trimestres.';
    }
  } else {
    if (num !== 8 && num !== 12) {
      return 'Para carreras semestrales la duración debe ser de 8 o 12 semestres.';
    }
  }
  return '';
}

/**
 * Devuelve la fecha máxima permitida (YYYY-MM-DD) para cumplir con la edad mínima (por defecto 17 años).
 */
export function getMaxBirthDate(minAge = LIMITS.MIN_AGE) {
  const today = new Date();
  today.setFullYear(today.getFullYear() - minAge);
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Valida que la fecha de nacimiento corresponda a una persona de al menos `minAge` años (17 por defecto).
 */
export function validateBirthDate(value = '', required = false, minAge = LIMITS.MIN_AGE) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return required ? 'La fecha de nacimiento es obligatoria.' : '';
  }
  const parts = trimmed.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return 'Ingresa una fecha de nacimiento válida.';
  }
  const [birthYear, birthMonth, birthDay] = parts;
  if (birthYear < 1920) {
    return 'Ingresa una fecha de nacimiento válida.';
  }
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (birthDate > today) {
    return 'La fecha de nacimiento no puede estar en el futuro.';
  }

  let age = today.getFullYear() - birthYear;
  const monthDiff = (today.getMonth() + 1) - birthMonth;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
    age--;
  }

  if (age < minAge) {
    return `La persona debe tener al menos ${minAge} años de edad.`;
  }

  return '';
}


