using API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261028140000_MessageDeliveryStatus")]
public partial class MessageDeliveryStatus : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "DateDelivered",
            table: "Messages",
            type: "TEXT",
            nullable: true);

        migrationBuilder.Sql("UPDATE Messages SET DateDelivered = DateRead WHERE DateRead IS NOT NULL;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "DateDelivered",
            table: "Messages");
    }
}
