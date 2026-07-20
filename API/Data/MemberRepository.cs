using API.Controllers;
using API.DTOs;
using API.Entities;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class MemberRepository (AppDbContext dbContext) : IMemberRepository
{
    public async Task<Member?> GetMemberByIdAsync(string id)
    {
        return await dbContext.Members.FindAsync(id);
    }

    public async Task<Member?> GetMemberWithUserByIdAsync(string id)
    {
        return await dbContext.Members
            .Include(x => x.User)
            .SingleOrDefaultAsync(x => x.Id == id);
    }

    public async Task<IReadOnlyList<Member>> GetMembersAsync()
    {
        return await dbContext.Members
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Photo>> GetPhotosForMemberAsync(string memberId)
    {
        // return list of photos for certain member
        return await dbContext.Members
            .Where(x => x.Id == memberId)
            .SelectMany(x => x.Photos)
            .ToListAsync();
    }

    public async Task<bool> SaveAllAsync()
    {
        return await dbContext.SaveChangesAsync() > 0; // returns bool, we should 
                                                    // check if sth needs to be saved
    }

    public void Update(Member member)
    {
        dbContext.Entry(member).State = EntityState.Modified;
    }
}