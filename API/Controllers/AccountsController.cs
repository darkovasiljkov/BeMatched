using System.Security.Cryptography;
using System.Text;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class AccountsController(UserManager<AppUser> userManager, ITokenService tokenService): BaseApiController
{
    [HttpPost("register")] // api/accounts/register
    public async Task<ActionResult<UserDto>> Register(RegisterDTO registerDTO)
    {
        var user = new AppUser
        {
            DisplayName = registerDTO.DisplayName,
            Email = registerDTO.Email,
            UserName = registerDTO.Email,
            Member = new Member
            {
                DisplayName = registerDTO.DisplayName,
                Gender = registerDTO.Gender,
                DateOfBirth = registerDTO.DateOfBirth,
                City = registerDTO.City,
                Country = registerDTO.Country
            }
        };
        var result = await userManager.CreateAsync(user, registerDTO.Password);

        if (!result.Succeeded)
        {
            foreach(var error in result.Errors)
            {
                ModelState.AddModelError("identity", error.Description);
            }

            return ValidationProblem();
        }

        await userManager.AddToRoleAsync(user, "Member");
        
        return await user.ToDto(tokenService);
    }

    [HttpPost("login")] // api/accounts/login
    public async Task<ActionResult<UserDto>> Login(LoginDTO loginDTO)
    {
       var user = await userManager.FindByEmailAsync(loginDTO.Email);

       if (user is null)
       {
            return Unauthorized("Invalid email address!");
       }

        var result = await userManager.CheckPasswordAsync(user, loginDTO.Password);

        if (!result) return Unauthorized("Invalid password!");

        return await user.ToDto(tokenService);
    }
}
