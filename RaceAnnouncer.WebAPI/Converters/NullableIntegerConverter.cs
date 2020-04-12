using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace RaceAnnouncer.WebAPI.Converters
{
  public class NullableIntegerConverter : JsonConverter<Nullable<int>>
  {
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

    public override void Write(
        Utf8JsonWriter writer
        , Nullable<int> dateTimeValue
        , JsonSerializerOptions options)
    {
      if (dateTimeValue == null) writer.WriteNullValue();
      else writer.WriteNumberValue((decimal)dateTimeValue);
    }
  }
}
