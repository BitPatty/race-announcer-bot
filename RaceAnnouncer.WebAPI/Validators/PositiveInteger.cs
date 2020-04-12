using System;
using System.ComponentModel.DataAnnotations;

namespace RaceAnnouncer.WebAPI.Validators
{
  public class PositiveInteger : ValidationAttribute
  {
    protected override ValidationResult IsValid(
      object value
      , ValidationContext validationContext)
    {
      if (value == null)
        return new ValidationResult($"Missing parameter: {validationContext.DisplayName}");

      if (Int32.TryParse(value?.ToString(), out int res) && res > 0)
        return ValidationResult.Success;

      return new ValidationResult($"{validationContext.DisplayName} must be an integer greater than 0");
    }
  }
}
