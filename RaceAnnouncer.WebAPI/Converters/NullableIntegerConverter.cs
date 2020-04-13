using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace RaceAnnouncer.WebAPI.Converters
{
  /// <summary>
  /// Conversion between numbers/strings and nullable integers
  /// </summary>
  public class NullableIntegerConverter : JsonConverter<Nullable<int>>
  {
    /// <summary>
    /// Converts nulls, strings and numbers to nullable integers
    /// </summary>
    /// <param name="reader">The JSON reader</param>
    /// <param name="typeToConvert">The type to convert</param>
    /// <param name="options">The serializer options</param>
    /// <returns>Returns the converted nullable integer</returns>
    public override Nullable<int> Read(
        ref Utf8JsonReader reader
        , Type typeToConvert
        , JsonSerializerOptions options
    )
    {
      if (
        reader.TokenType != JsonTokenType.String
        && reader.TokenType != JsonTokenType.Number
        && reader.TokenType != JsonTokenType.Null
      )
      {
        throw new JsonException("The JSON value is not in a supported format");
      }

      if (reader.TokenType == JsonTokenType.Null)
      {
        return null;
      }
      else if (
        reader.TokenType == JsonTokenType.String
        && Int32.TryParse(reader.GetString(), out int intFromString)
      )
      {
        return intFromString;
      }
      else if (
        reader.TokenType == JsonTokenType.Number
        && reader.TryGetInt32(out int intFromNumber)
      )
      {
        return intFromNumber;
      }

      throw new JsonException("Either the JSON value is not in a supported format, or is out of bounds for an Int32.");
    }

    /// <summary>
    /// Converts a nullable integer value to a null or number
    /// </summary>
    /// <param name="writer">The JSON writer</param>
    /// <param name="value">The value</param>
    /// <param name="options">The serializer options</param>
    public override void Write(
        Utf8JsonWriter writer
        , Nullable<int> value
        , JsonSerializerOptions options)
    {
      if (value == null) writer.WriteNullValue();
      else writer.WriteNumberValue((decimal)value);
    }
  }
}
