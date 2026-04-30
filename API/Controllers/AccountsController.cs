using System.Security.Cryptography;
using System.Text;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class AccountsController(AppDbContext dbContext, ITokenService tokenService): BaseApiController
{
    [HttpPost("register")] // api/accounts/register
    public async Task<ActionResult<UserDto>> Register(RegisterDTO registerDTO)
    {
        if (await EmailExists(registerDTO.Email))
        {
            return BadRequest("Email is taken!");
        }
        using var hmac = new HMACSHA512();

        var user = new AppUser
        {
            DisplayName = registerDTO.DisplayName,
            Email = registerDTO.Email,
            PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(registerDTO.Password)),
            PasswordSalt = hmac.Key
        };

        dbContext.Users.Add(user);

        await dbContext.SaveChangesAsync();

        return user.ToDto(tokenService);
    }

    [HttpPost("login")] // api/accounts/login
    public async Task<ActionResult<UserDto>> Login(LoginDTO loginDTO)
    {
       var user = await dbContext.Users.SingleOrDefaultAsync(x => x.Email == loginDTO.Email);

       if (user is null)
        {
            return Unauthorized("Invalid email credential.");
        }

        using var hmac = new HMACSHA512(user.PasswordSalt);

        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(loginDTO.Password));

        for (int i=0; i< computedHash.Length; i++)
        {
            if (computedHash[i] != user.PasswordHash[i])
            {
                return Unauthorized("Invalid password credential.");
            }
        }
        
        return user.ToDto(tokenService);
    }

    private async  Task<bool> EmailExists(string email)
    {
        return await dbContext.Users.AnyAsync(x => x.Email.ToLower() == email.ToLower());
    }
}
