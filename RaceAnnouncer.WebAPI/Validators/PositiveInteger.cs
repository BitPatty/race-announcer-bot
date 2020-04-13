using System.ComponentModel.DataAnnotations;

namespace RaceAnnouncer.WebAPI.Validators
{
  /// <summary>
  /// Validates that a value is an integer and greater than 1
  /// </summary>
  public class PositiveInteger : ValidationAttribute
  {
    /// <summary>
    /// Checks whether the value is a valid positive integer
    /// </summary>
    /// <param name="value">The value</param>
    /// <param name="validationContext">The validation context</param>
    /// <returns>Returns the validation result</returns>
    protected override ValidationResult IsValid(
      object value
      , ValidationContext validationContext)
    {
      if (value == null)
        return new ValidationResult($"Missing parameter: {validationContext.DisplayName}");

      if (int.TryParse(value?.ToString(), out int res) && res > 0)
        return ValidationResult.Success;

      return new ValidationResult($"{validationContext.DisplayName} must be an integer greater than 0");
    }
  }
}
