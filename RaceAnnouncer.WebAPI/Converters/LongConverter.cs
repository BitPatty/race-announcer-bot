using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace RaceAnnouncer.WebAPI.Converters
{
  public class LongConverter : JsonConverter<long>
  {
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

    public override void Write(
        Utf8JsonWriter writer
        , long value
        , JsonSerializerOptions options)
    {
      writer.WriteNumberValue((decimal)value);
    }
  }
}
