import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TeamService } from './team.service';
import { LoaderService, TitleHeaderService, LanguageService } from '../common';

@Component({
  selector: 'team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})
export class TeamComponent implements OnInit, OnDestroy {
  // tslint:disable-next-line:no-any
  teamList: any;
  teamSubscribe: Subscription;
  getTranslationSubscribe: Subscription;

  constructor(
    private teamService: TeamService,
    private loaderService: LoaderService,
    private titleHeaderService: TitleHeaderService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loaderService.setLoader(false);

    // tslint:disable-next-line:no-any
    this.getTranslationSubscribe = this.languageService.getTranslation('TEAM').subscribe((trans: any) => {
      this.titleHeaderService.setTitle(`Dollar Street ${trans}`);
    });

    // tslint:disable-next-line:no-any
    this.teamSubscribe = this.teamService.getTeam(this.languageService.getLanguageParam()).subscribe((res: any) => {
      if (res.err) {
        console.error(res.err);
        return;
      }

      this.teamList = res.data;
      this.loaderService.setLoader(true);
    });
  }

  ngOnDestroy(): void {
    this.teamSubscribe.unsubscribe();
    this.getTranslationSubscribe.unsubscribe();
    this.loaderService.setLoader(false);
  }
}
