import { Component, OnDestroy, OnInit } from "@angular/core";
import { Column } from "../../shared/column.type";
import { SciCatDataSource } from "../../shared/services/scicat.datasource";
import { ScicatDataService } from "../../shared/services/scicat-data-service";
import { ExportExcelService } from "../../shared/services/export-excel.service";
import { DatePipe, JsonPipe } from "@angular/common";

@Component({
  selector: "app-jobs-new-dashboard",
  templateUrl: "./jobs-dashboard-new.component.html",
  styleUrls: ["./jobs-dashboard-new.component.css"]
})

export class JobsDashboardNewComponent implements OnInit, OnDestroy {

  columns: Column[] = [
    { id: "id", label: "ID", canSort: true, matchMode: "contains", hideOrder: 0, },
    { id: "emailJobInitiator", label: "Initiator", canSort: true, matchMode: "contains", hideOrder: 1, },
    { id: "type", label: "Type", canSort: true, matchMode: "is", hideOrder: 2, },
    { id: "creationTime", label: "Created at", format: "date medium", canSort: true, matchMode: "after", hideOrder: 3, },
    { id: "jobParams", label: "Parameters", format: "json", canSort: false, hideOrder: 4, },
    { id: "jobStatusMessage", label: "Status", format: "json", canSort: true, matchMode: "contains", hideOrder: 5, },
    { id: "datasetList", label: "Datasets", format: "json", canSort: false, hideOrder: 6, },
    { id: "jobResultObject", label: "Result", format: "json", canSort: false, matchMode: "contains", hideOrder: 7, },
  ]

  tableDefinition = {
    api: "http://localhost:3000/api/v3/",
    collection: "Jobs",
    columns: this.columns
  }


  dataSource: SciCatDataSource;

  constructor(private dataService: ScicatDataService, private exportService: ExportExcelService) { }

  ngOnInit() {
    this.dataSource = new SciCatDataSource(this.dataService, this.exportService, this.tableDefinition);
  }

  ngOnDestroy() {
    this.dataSource.disconnectExportData()
  }
}
