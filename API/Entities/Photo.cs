using System;
using System.Text.Json.Serialization;

namespace API.Entities;

public class Photo
{
    public int Id { get; set; }

    public required string Url { get; set; }

    public string? PublicId { get; set; }

    // Nav property
    // One To many -> One member can have many photos
    [JsonIgnore]
    public Member Member { get; set;} = null!;

    public string MemberId { get; set; } = null!;

}