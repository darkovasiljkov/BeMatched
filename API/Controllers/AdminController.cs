using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class AdminController(UserManager<AppUser> userManager, AppDbContext dbContext) : BaseApiController
{
    [Authorize(Policy = "RequiredAdminRole")]
    [HttpGet("users-with-roles")]
    public async Task<ActionResult> GetUsersWithRoles()
    {
        var users = await userManager.Users.OrderBy(x => x.Email).ToListAsync();
        var userList = new List<object>();

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            userList.Add(new
            {
                user.Id,
                user.Email,
                Roles = roles.ToList()
            });
        }
        return Ok(userList);
    }

    [Authorize(Policy = "RequiredAdminRole")]
    [HttpPost("edit-roles/{userId}")]
    public async Task<ActionResult> EditRoles(string userId, [FromQuery] string roles)
    {
        if (string.IsNullOrEmpty(roles)) return BadRequest("You must select at least one role!");

        var selectedRoles = roles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct().ToArray();
        string[] availableRoles = ["Member", "Moderator", "Admin"];

        if (selectedRoles.Length == 0) return BadRequest("You must select at least one role!");
        if (selectedRoles.Except(availableRoles).Any()) return BadRequest("An invalid role was selected.");

        var user = await userManager.FindByIdAsync(userId);

        if (user == null) return BadRequest("Could not retrieve user");

        // Both Identity updates must succeed together, otherwise roll back the change.
        await using var transaction = await dbContext.Database.BeginTransactionAsync();
        var userRoles = await userManager.GetRolesAsync(user);

        // Enforce this in the API too: a disabled checkbox alone cannot protect admins.
        if (userRoles.Contains("Admin") && !selectedRoles.Contains("Admin"))
            return BadRequest("The Admin role cannot be removed from an existing administrator.");

        var result = await userManager.AddToRolesAsync(user, selectedRoles.Except(userRoles));

        if (!result.Succeeded) return BadRequest("Failed to add to roles!");

        result = await userManager.RemoveFromRolesAsync(user, userRoles.Except(selectedRoles));
        
        if (!result.Succeeded) return BadRequest("Failed to remove from roles");
        await transaction.CommitAsync();
        return Ok(await userManager.GetRolesAsync(user));
    }

    [Authorize(Policy = "ModeratePhotoRole")]
    [HttpGet("photos-to-moderate")]
    public ActionResult GetPhotosForModeration()
    {
        return Ok("Admins or moderators can see this!");
    }
}
