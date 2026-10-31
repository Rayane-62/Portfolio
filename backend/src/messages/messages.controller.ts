import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { MessageQuery, ReadDto } from './messages.dto';
import { MessagesService } from './messages.service';

/** Les messages reçus par le formulaire de contact du site. */
@Controller('admin/messages')
@UseGuards(AdminAuthGuard)
export class AdminMessagesController {
  constructor(private readonly messages: MessagesService) {}

  /** ?filter=nonlus|lus&page=1&limit=50 — du plus récent au plus ancien. */
  @Get()
  list(@Query() query: MessageQuery) {
    return this.messages.list(query);
  }

  /** Tout marquer comme lu. */
  @Patch('read-all')
  @HttpCode(200)
  readAll() {
    return this.messages.readAll();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.messages.get(id);
  }

  /** { read: true } = lu, { read: false } = non lu. */
  @Patch(':id/read')
  setRead(@Param('id', ParseIntPipe) id: number, @Body() dto: ReadDto) {
    return this.messages.setRead(id, dto.read);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.messages.remove(id);
  }
}
