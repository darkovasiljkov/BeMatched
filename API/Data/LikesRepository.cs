using API.Entities;
using API.Helpers;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class LikesRepository(AppDbContext dbContext) : ILikesRepository
{
    public async Task AddLike(MemberLike like)
    {
        await dbContext.AddAsync(like);
    }

    public void DeleteLike(MemberLike like)
    {
        dbContext.Remove(like);
    }

    public async Task<IReadOnlyList<string>> GetCurrentMemberLikeIds(string memberId)
    {
            return await dbContext.Likes
                .Where(x => x.SourceMemberId == memberId)
                .Select(x => x.TargetMemberId)
                .ToListAsync();
    }

    public async Task<MemberLike?> GetMemberLike(string sourceMemberId, string targetMemberId)
    {
        return await dbContext.Likes.FindAsync(sourceMemberId, targetMemberId);
    }

    public async Task<PaginatedResult<Member>> GetMemberLikes(LikesParams likesParams)
    {
        var query = dbContext.Likes.AsQueryable();

        IQueryable<Member> result;

        switch (likesParams.Predicate)
        {
            case "liked":
                result = query.Where(x => x.SourceMemberId == likesParams.MemberId)
                    .Select(x => x.TargetMember);
                break;
            case "likedBy":
                result = query.Where(x => x.TargetMemberId == likesParams.MemberId).Select(x => x.SourceMember);
                break;
            default:
                var likeIds = await GetCurrentMemberLikeIds(likesParams.MemberId);

                result = query.Where(x => x.TargetMemberId == likesParams.MemberId && likeIds.Contains(x.SourceMemberId)).Select(x => x.SourceMember);
                break;
        }

        return await PaginationHelper.CreateAsync(result, likesParams.PageNumber, likesParams.PageSize);
    }

    public async Task<bool> SaveAllChanges()
    {
        return await dbContext.SaveChangesAsync() > 0;
    }
}
