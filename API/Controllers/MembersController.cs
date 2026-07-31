using System.Security.Claims;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    public class MembersController(IMemberRepository memberRepository, IPhotoService photoService) : BaseApiController
    {
        [HttpGet] // localhost:5001/api/members
        public async Task<ActionResult<IReadOnlyList<Member>>> GetMembers()
        {
            return Ok(await memberRepository.GetMembersAsync());
        }

        [HttpGet("{id}")] // localhost:5001/api/members/bob-id
        public async Task<ActionResult<Member>> GetMember(string id)
        {
            var member = await memberRepository.GetMemberByIdAsync(id);

            if (member == null)
            {
                return NotFound();
            }
            
            return member;
        }

        [HttpGet("{id}/photos")]
        public async Task<ActionResult<IReadOnlyList<Photo>>> GetMemberPhotos(string id)
        {
            return Ok(await memberRepository.GetPhotosForMemberAsync(id));
        }

        [HttpPut]
        public async Task<ActionResult> UpdateMember(MemberUpdateDto memberUpdateDto)
        {
            var memberId = User.GetMemberId();

            var member = await memberRepository.GetMemberWithUserByIdAsync(memberId);

            if (member == null) return BadRequest("Could not get member");

            member.DisplayName = memberUpdateDto.DisplayName ?? member.DisplayName;
            member.Description = memberUpdateDto.Description ?? member.Description;
            member.City = memberUpdateDto.City ?? member.DisplayName;
            member.Country = memberUpdateDto.Country ?? member.Country;
    
            member.User.DisplayName = memberUpdateDto.DisplayName ?? member.User.DisplayName;

            // memberRepository.Update(member); // optional

            if (await memberRepository.SaveAllAsync())
            {
                return NoContent();
            } 

            return BadRequest("Updating member failed!");
        }

        [HttpPost("add-photo")]
        public async Task<ActionResult<Photo>> AddPhoto([FromForm]IFormFile file)
        {
            var member = await memberRepository.GetMemberWithUserByIdAsync(User.GetMemberId());
            
            if (member == null) return BadRequest("Cannot update member");

            var result = await photoService.UploadPhotoAsync(file);

            if (result.Error != null) return BadRequest(result.Error.Message);

            Photo photo = new Photo
            {
                Url = result.SecureUrl.AbsoluteUri,
                PublicId = result.PublicId,
                MemberId = User.GetMemberId()
            };

            if (member.ImageUrl != null)
            {
                member.ImageUrl = photo.Url;
                member.User.ImageUrl = photo.Url;
            }

            member.Photos.Add(photo);

            if (await memberRepository.SaveAllAsync()) return photo;

            return BadRequest("No photo!");
        }

        [HttpPut("set-main-photo/{photoId}")]
        public async Task<ActionResult> SetMainPhoto(int photoId)
        {
            var member = await memberRepository.GetMemberWithUserByIdAsync(User.GetMemberId());

            if (member == null) return BadRequest("Cannot get member from token");

            var photo = member.Photos.SingleOrDefault(x => x.Id == photoId);

            if (photo == null)
            {
                return BadRequest("Photo not found");
            }

            if (member.ImageUrl == photo.Url)
            {
                return BadRequest("This photo is already the main image");
            }

            member.ImageUrl = photo.Url;
            member.User.ImageUrl = photo.Url;

            if (await memberRepository.SaveAllAsync()) return NoContent();

            return BadRequest("Problem with setting main photo.");
        }
    }
}
