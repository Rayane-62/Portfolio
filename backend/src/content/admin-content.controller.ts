import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import {
  AdminProjectQuery,
  CreateEducationDto,
  CreateExperienceDto,
  CreateProjectDto,
  CreateSkillDto,
  ReorderDto,
  UpdateEducationDto,
  UpdateExperienceDto,
  UpdateProjectDto,
  UpdateSkillDto,
  VisibleDto,
} from './content.dto';
import { EducationsService } from './educations.service';
import { ExperiencesService } from './experiences.service';
import { ProjectsService } from './projects.service';
import { SkillsService } from './skills.service';

@Controller('admin/skills')
@UseGuards(AdminAuthGuard)
export class AdminSkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  list() {
    return this.skills.list();
  }

  @Post()
  create(@Body() dto: CreateSkillDto) {
    return this.skills.create(dto);
  }

  /** Nouvel ordre d'affichage : { ids: [3, 1, 2, …] } */
  @Put('order')
  reorder(@Body() dto: ReorderDto) {
    return this.skills.reorder(dto.ids);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.skills.get(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSkillDto) {
    return this.skills.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.skills.remove(id);
  }
}

@Controller('admin/experiences')
@UseGuards(AdminAuthGuard)
export class AdminExperiencesController {
  constructor(private readonly experiences: ExperiencesService) {}

  @Get()
  list() {
    return this.experiences.list();
  }

  @Post()
  create(@Body() dto: CreateExperienceDto) {
    return this.experiences.create(dto);
  }

  @Put('order')
  reorder(@Body() dto: ReorderDto) {
    return this.experiences.reorder(dto.ids);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.experiences.get(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExperienceDto) {
    return this.experiences.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.experiences.remove(id);
  }
}

@Controller('admin/educations')
@UseGuards(AdminAuthGuard)
export class AdminEducationsController {
  constructor(private readonly educations: EducationsService) {}

  @Get()
  list() {
    return this.educations.list();
  }

  @Post()
  create(@Body() dto: CreateEducationDto) {
    return this.educations.create(dto);
  }

  @Put('order')
  reorder(@Body() dto: ReorderDto) {
    return this.educations.reorder(dto.ids);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.educations.get(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEducationDto) {
    return this.educations.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.educations.remove(id);
  }
}

@Controller('admin/projects')
@UseGuards(AdminAuthGuard)
export class AdminProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  /** ?category=web|mobile|desktop&filter=visible|masque|featured */
  @Get()
  list(@Query() query: AdminProjectQuery) {
    return this.projects.listAdmin(query);
  }

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }

  @Put('order')
  reorder(@Body() dto: ReorderDto) {
    return this.projects.reorder(dto.ids);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.projects.get(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.projects.update(id, dto);
  }

  /** Afficher / masquer sur le site : { visible: false } */
  @Patch(':id/visible')
  setVisible(@Param('id', ParseIntPipe) id: number, @Body() dto: VisibleDto) {
    return this.projects.setVisible(id, dto.visible);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.projects.remove(id);
  }
}
