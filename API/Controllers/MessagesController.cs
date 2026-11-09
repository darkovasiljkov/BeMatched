using System;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using API.Services;

namespace API.Controllers;

[Authorize]
public class MessagesController(IMessageRepository messageRepository, MessageSender messageSender) : BaseApiController
{
    [HttpPost]
    public async Task<ActionResult<MessageDto>> CreateMessage (CreateMessageDto createMessageDto)
    {
        var message = await messageSender.SendMessage(User.GetMemberId(), createMessageDto);
        if (message == null) return BadRequest("Unable to send this message.");
        return message;
        
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<MessageDto>>> GetMessagesByContainer([FromQuery] MessageParams messageParams)
    {
        messageParams.MemberId = User.GetMemberId();

        return await messageRepository.GetMessagesForMember(messageParams);
    }

    [HttpGet("thread/{recipientId}")]
    public async Task<ActionResult<IReadOnlyList<MessageDto>>> GetMessageThread(string recipientId)
    {
        return Ok(await messageRepository.GetMessageThread(User.GetMemberId(), recipientId));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteMessage(string id)
    {
        var memberId = User.GetMemberId();

        var message = await messageRepository.GetMessage(id);

        if (message == null) return NotFound();

        if (message.SenderId != memberId && message.RecipientId != memberId)
        {
            return Forbid();
        }

        // Repeating a deletion should still succeed.
        if ((message.SenderId == memberId && message.SenderDeleted)
            || (message.RecipientId == memberId && message.RecipientDeleted))
        {
            return NoContent();
        }

        if (message.SenderId == memberId)
        {
            message.SenderDeleted = true;
        }
        if (message.RecipientId == memberId)
        {
            message.RecipientDeleted = true;
        }

        if (message is { SenderDeleted: true, RecipientDeleted: true })
        {
            messageRepository.DeleteMessage(message);
        }

        if (await messageRepository.SaveAllAsync()) return NoContent();
        return BadRequest("Problem deleting message!");
    }
}
