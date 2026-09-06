using System.Security.Claims;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    public class LikesController(ILikesRepository likesRepository) : BaseApiController
    {
        [HttpPost("{targetMemberId}")]
        public async Task<ActionResult<IReadOnlyList<Member>>> ToggleLike([FromRoute] string targetMemberId)
        {
            var sourceMemberId = User.GetMemberId();
            
            if (sourceMemberId == targetMemberId) return BadRequest("You cannot like yourself");

            var existingLike = await likesRepository.GetMemberLike(sourceMemberId, targetMemberId);

            if (existingLike == null)
            {
                MemberLike like = new()
                {
                    SourceMemberId = sourceMemberId,
                    TargetMemberId = targetMemberId
                };

                await likesRepository.AddLike(like);
            }
            else
            {
                likesRepository.DeleteLike(existingLike);
            }

            if (await likesRepository.SaveAllChanges()) return Ok();

            return BadRequest("There was an error when update a like!");
        }

        [HttpGet("list")]
        public async Task<ActionResult<IReadOnlyList<string>>> GetCurrentMemberLikeIds()
        {
            return Ok(await likesRepository.GetCurrentMemberLikeIds(User.GetMemberId()));
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResult<Member>>> GetMemberLikes(
            [FromQuery] LikesParams likesParams
        )
        {
            likesParams.MemberId = User.GetMemberId();
            var members = await likesRepository.GetMemberLikes(likesParams);

            return Ok(members);
        }
    }
}
