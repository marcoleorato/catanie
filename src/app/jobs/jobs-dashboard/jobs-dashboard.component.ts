import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Store, select } from "@ngrx/store";
import { Job } from "shared/sdk";
import { Subscription } from "rxjs";
import {
  getJobs,
  getJobsCount,
  getJobsPerPage,
  getPage,
  getFilters,
} from "state-management/selectors/jobs.selectors";
import { DatePipe } from "@angular/common";
import {
  TableColumn,
  PageChangeEvent,
  SortChangeEvent,
} from "shared/modules/table/table.component";
import { JobViewMode } from "state-management/models";
import {
  changePageAction,
  setJobViewModeAction,
  fetchJobsAction,
  sortByColumnAction,
} from "state-management/actions/jobs.actions";
import {
  getCurrentUser,
  getProfile,
} from "state-management/selectors/user.selectors";

export interface JobsTableData {
  id: string;
  initiator: string;
  type: string;
  createdAt: string | null;
  statusMessage: string;
}

@Component({
  selector: "app-jobs-dashboard",
  templateUrl: "./jobs-dashboard.component.html",
  styleUrls: ["./jobs-dashboard.component.scss"],
})
export class JobsDashboardComponent implements OnInit, OnDestroy {
  jobsCount$ = this.store.pipe(select(getJobsCount));
  jobsPerPage$ = this.store.pipe(select(getJobsPerPage));
  currentPage$ = this.store.pipe(select(getPage));

  jobs: JobsTableData[] = [];
  profile: any;
  email = "";

  subscriptions: Subscription[] = [];

  modes = this.enumKeys(JobViewMode);
  currentMode: "myJobs" | "allJobs" = "myJobs";

  paginate = true;

  tableColumns: TableColumn[] = [
    {
      name: "initiator",
      icon: "mail",
      sort: true,
      inList: true,
    },
    { name: "type", icon: "bubble_chart", sort: true, inList: true },
    {
      name: "createdAt",
      icon: "brightness_high",
      sort: true,
      inList: true,
    },
    {
      name: "statusMessage",
      icon: "comment",
      sort: true,
      inList: true,
    },
  ];

  constructor(
    private datePipe: DatePipe,
    private router: Router,
    private store: Store<Job>
  ) {}

  private enumKeys<T>(enumType: T): (keyof T)[] {
    return (Object.keys(enumType) as Array<keyof T>).filter(
      (value) => isNaN(Number(value)) !== false
    );
  }

  formatTableData(jobs: Job[]): JobsTableData[] {
    let tableData: JobsTableData[] = [];
    if (jobs) {
      tableData = jobs.map((job) => ({
        id: job.id,
        initiator: job.emailJobInitiator,
        type: job.type,
        createdAt: this.datePipe.transform(
          job.creationTime,
          "yyyy-MM-dd HH:mm"
        ),
        statusMessage: job.jobStatusMessage,
      }));
    }
    return tableData;
  }

  onModeToggleChange() {
    switch (this.currentMode) {
      case "allJobs": {
        this.onModeChange(JobViewMode.allJobs);
        break;
      }
      case "myJobs": {
        this.onModeChange(JobViewMode.myJobs);
        break;
      }
    }
  }

  onModeChange(mode: JobViewMode) {
    let viewMode: Record<string, string> | undefined = {};
    switch (mode) {
      case JobViewMode.allJobs: {
        viewMode = undefined;
        break;
      }
      case JobViewMode.myJobs: {
        viewMode = { emailJobInitiator: this.email };
        break;
      }
      default: {
        break;
      }
    }
    this.store.dispatch(setJobViewModeAction({ mode: viewMode }));
  }

  onPageChange(event: PageChangeEvent) {
    this.store.dispatch(
      changePageAction({ page: event.pageIndex, limit: event.pageSize })
    );
  }

  onRowClick(job: Job) {
    const id = encodeURIComponent(job.id);
    this.router.navigateByUrl("/user/jobs/" + id);
  }

  onSortChange(event: SortChangeEvent) {
    // map column names back to original names
    switch (event.active) {
      case "statusMessage": {
        event.active = "jobStatusMessage";
        break;
      }
      case "initiator": {
        event.active = "emailJobInitiator";
        break;
      }
      default: {
        break;
      }
    }
    const { active: column, direction } = event;
    this.store.dispatch(sortByColumnAction({ column, direction }));
  }

  ngOnInit() {
    this.store.dispatch(fetchJobsAction());

    this.subscriptions.push(
      this.store.pipe(select(getJobs)).subscribe((jobs) => {
        this.jobs = this.formatTableData(jobs);
      })
    );

    this.subscriptions.push(
      this.store.pipe(select(getCurrentUser)).subscribe((current) => {
        if (current) {
          this.email = current.email;

          if (!current.realm) {
            this.store.pipe(select(getProfile)).subscribe((profile) => {
              if (profile) {
                this.profile = profile;
                this.email = profile.email;
              }
              this.onModeChange(JobViewMode.myJobs);
            });
          } else {
            this.onModeChange(JobViewMode.myJobs);
          }
        }
      })
    );

    this.subscriptions.push(
      this.store.pipe(select(getFilters)).subscribe((filters) => {
        this.router.navigate(["/user/jobs"], {
          queryParams: { args: JSON.stringify(filters) },
        });
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
