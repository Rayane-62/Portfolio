import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { DashboardService } from './dashboard.service';
import { UpdateInfoDto } from './info.dto';
import { InfoService } from './info.service';

/**
 * « Mes informations » : identité, photo, CV, contacts, chiffres et réseaux.
 * Le GET renvoie la ligne telle qu'elle est en base (pseudos des réseaux, pas les liens) :
 * c'est ce que les champs du formulaire de l'admin doivent afficher.
 */
@Controller('admin/info')
@UseGuards(AdminAuthGuard)
export class AdminInfoController {
  constructor(private readonly info: InfoService) {}

  @Get()
  get() {
    return this.info.get();
  }

  @Patch()
  update(@Body() dto: UpdateInfoDto) {
    return this.info.update(dto);
  }
}

@Controller('admin/dashboard')
@UseGuards(AdminAuthGuard)
export class AdminDashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  get() {
    return this.dashboard.get();
  }
}
