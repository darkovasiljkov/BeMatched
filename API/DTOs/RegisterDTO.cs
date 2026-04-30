using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace API.DTOs;

public class RegisterDTO
{
    [Required]
    public string DisplayName { get; set;} = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set;} = string.Empty;

    [Required]
    [MinLength(4)]
    public string Password { get; set;} = string.Empty;
}
