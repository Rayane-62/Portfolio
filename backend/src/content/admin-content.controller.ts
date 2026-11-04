import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import {
  AddImagesDto,
  AdminProjectQuery,
  CreateEducationDto,
  CreateExperienceDto,
  CreateProjectDto,
  CreateSectionDto,
  CreateSkillDto,
  ReorderDto,
  UpdateEducationDto,
  UpdateExperienceDto,
  UpdateProjectDto,
  UpdateSectionDto,
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

  // ─── Parties et galeries : chaque route renvoie la liste à jour des parties ──

  @Get(':id/sections')
  sections(@Param('id', ParseIntPipe) id: number) {
    return this.projects.listSections(id);
  }

  @Post(':id/sections')
  createSection(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateSectionDto) {
    return this.projects.createSection(id, dto);
  }

  @Put(':id/sections/order')
  reorderSections(@Param('id', ParseIntPipe) id: number, @Body() dto: ReorderDto) {
    return this.projects.reorderSections(id, dto.ids);
  }

  @Patch(':id/sections/:sectionId')
  updateSection(
    @Param('id', ParseIntPipe) id: number,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.projects.updateSection(id, sectionId, dto);
  }

  @Delete(':id/sections/:sectionId')
  removeSection(@Param('id', ParseIntPipe) id: number, @Param('sectionId', ParseIntPipe) sectionId: number) {
    return this.projects.removeSection(id, sectionId);
  }

  /** Photos envoyées au préalable par /admin/uploads?kind=project : { publicIds: [...] } */
  @Post(':id/sections/:sectionId/images')
  addImages(
    @Param('id', ParseIntPipe) id: number,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() dto: AddImagesDto,
  ) {
    return this.projects.addImages(id, sectionId, dto.publicIds);
  }

  @Put(':id/sections/:sectionId/images/order')
  reorderImages(
    @Param('id', ParseIntPipe) id: number,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() dto: ReorderDto,
  ) {
    return this.projects.reorderImages(id, sectionId, dto.ids);
  }

  @Delete(':id/images/:imageId')
  removeImage(@Param('id', ParseIntPipe) id: number, @Param('imageId', ParseIntPipe) imageId: number) {
    return this.projects.removeImage(id, imageId);
  }
}
