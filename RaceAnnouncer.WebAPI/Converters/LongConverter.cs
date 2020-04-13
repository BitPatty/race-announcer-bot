using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace RaceAnnouncer.WebAPI.Converters
{
  /// <summary>
  /// Conversion between numbers/strings and longs
  /// </summary>
  public class LongConverter : JsonConverter<long>
  {
    /// <summary>
    /// Converts strings and numbers to longs
    /// </summary>
    /// <param name="reader">The JSON reader</param>
    /// <param name="typeToConvert">The type to convert</param>
    /// <param name="options">The serializer options</param>
    /// <returns>Returns the converted long</returns>
    public override long Read(
        ref Utf8JsonReader reader
        , Type typeToConvert
        , JsonSerializerOptions options
    )
    {
      if (
        reader.TokenType != JsonTokenType.String
        && reader.TokenType != JsonTokenType.Number
      )
      {
        throw new JsonException("The JSON value is not in a supported format");
      }

      if (
        reader.TokenType == JsonTokenType.String
        && Int64.TryParse(reader.GetString(), out long longFromString)
      )
      {
        return longFromString;
      }
      else if (
        reader.TokenType == JsonTokenType.Number
        && reader.TryGetInt64(out long longFromNumber)
      )
      {
        return longFromNumber;
      }

      throw new JsonException("Either the JSON value is not in a supported format, or is out of bounds for an Int64.");
    }

    /// <summary>
    /// Converts a long value to a number
    /// </summary>
    /// <param name="writer">The JSON writer</param>
    /// <param name="value">The value</param>
    /// <param name="options">The serializer options</param>
    public override void Write(
        Utf8JsonWriter writer
        , long value
        , JsonSerializerOptions options)
    {
      writer.WriteNumberValue((decimal)value);
    }
  }
}
