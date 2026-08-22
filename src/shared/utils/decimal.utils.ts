import Decimal from "decimal.js";

/**
 * Utility class for handling decimal operations with precision
 * Solves floating point precision issues in JavaScript
 */
export class DecimalUtils {
  /**
   * Safely add two decimal numbers
   * @param a First number
   * @param b Second number
   * @returns Sum as number with proper precision
   */
  static add(a: number | string, b: number | string): number {
    const decimalA = new Decimal(a);
    const decimalB = new Decimal(b);
    return decimalA.plus(decimalB).toNumber();
  }

  static toNumber(value: number | string): number {
    console.log(typeof new Decimal(value).toNumber());
    return new Decimal(value).toNumber();
  }

  /**
   * Safely subtract two decimal numbers
   * @param a First number (minuend)
   * @param b Second number (subtrahend)
   * @returns Difference as number with proper precision
   */
  static subtract(a: number | string, b: number | string): number {
    const decimalA = new Decimal(a);
    const decimalB = new Decimal(b);
    return decimalA.minus(decimalB).toNumber();
  }

  /**
   * Safely multiply two decimal numbers
   * @param a First number
   * @param b Second number
   * @returns Product as number with proper precision
   */
  static multiply(a: number | string, b: number | string): number {
    const decimalA = new Decimal(a);
    const decimalB = new Decimal(b);
    return decimalA.times(decimalB).toNumber();
  }

  /**
   * Safely divide two decimal numbers
   * @param a Dividend
   * @param b Divisor
   * @returns Quotient as number with proper precision
   */
  static divide(a: number | string, b: number | string): number {
    const decimalA = new Decimal(a);
    const decimalB = new Decimal(b);
    return decimalA.dividedBy(decimalB).toNumber();
  }

  /**
   * Sum an array of decimal numbers
   * @param numbers Array of numbers to sum
   * @returns Sum as number with proper precision
   */
  static sum(numbers: (number | string)[]): number {
    if (numbers.length === 0) return 0;

    return numbers.reduce<number>((acc, current) => DecimalUtils.add(acc, current), 0);
  }

  /**
   * Calculate percentage of a number
   * @param amount Base amount
   * @param percentage Percentage value (e.g., 15 for 15%)
   * @returns Percentage amount as number
   */
  static percentage(amount: number | string, percentage: number | string): number {
    return DecimalUtils.divide(DecimalUtils.multiply(amount, percentage), 100);
  }

  /**
   * Round number to specified decimal places
   * @param number Number to round
   * @param decimalPlaces Number of decimal places (default: 2)
   * @returns Rounded number
   */
  static round(number: number | string, decimalPlaces: number = 2): number {
    const decimal = new Decimal(number);
    return decimal.toDecimalPlaces(decimalPlaces).toNumber();
  }

  /**
   * Format number for display with proper decimal places
   * @param number Number to format
   * @param decimalPlaces Number of decimal places (default: 2)
   * @returns Formatted string
   */
  static format(number: number | string, decimalPlaces: number = 2): string {
    const decimal = new Decimal(number);
    return decimal.toFixed(decimalPlaces);
  }

  /**
   * Compare two decimal numbers
   * @param a First number
   * @param b Second number
   * @returns -1 if a < b, 0 if a === b, 1 if a > b
   */
  static compare(a: number | string, b: number | string): number {
    const decimalA = new Decimal(a);
    const decimalB = new Decimal(b);
    return decimalA.comparedTo(decimalB);
  }

  /**
   * Check if two decimal numbers are equal
   * @param a First number
   * @param b Second number
   * @returns True if equal, false otherwise
   */
  static equals(a: number | string, b: number | string): boolean {
    return DecimalUtils.compare(a, b) === 0;
  }

  /**
   * Get absolute value of a decimal number
   * @param number Input number
   * @returns Absolute value
   */
  static abs(number: number | string): number {
    const decimal = new Decimal(number);
    return decimal.abs().toNumber();
  }

  /**
   * Convert database decimal string to number safely
   * Handle cases where database returns string representation
   * @param dbValue Value from database
   * @returns Converted number
   */
  static fromDatabase(dbValue: any): number {
    if (dbValue === null || dbValue === undefined) {
      return 0;
    }
    return new Decimal(dbValue).toNumber();
  }

  /**
   * Prepare number for database storage
   * @param value Number to store
   * @returns String representation suitable for database
   */
  static toDatabase(value: number | string): string {
    const decimal = new Decimal(value);
    return decimal.toString();
  }
}
