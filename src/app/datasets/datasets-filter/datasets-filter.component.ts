import { APP_CONFIG, AppConfig } from "app-config.module";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { select, Store } from "@ngrx/store";
import {
  debounceTime,
  distinctUntilChanged,
  skipWhile,
  map,
} from "rxjs/operators";

import { FacetCount } from "state-management/state/datasets.store";
import {
  getCreationTimeFilter,
  getGroupFacetCounts,
  getGroupFilter,
  getHasAppliedFilters,
  getKeywordFacetCounts,
  getKeywordsFilter,
  getLocationFacetCounts,
  getLocationFilter,
  getScientificConditions,
  getSearchTerms,
  getTypeFacetCounts,
  getTypeFilter,
  getKeywordsTerms,
  getMetadataKeys,
} from "state-management/selectors/datasets.selectors";

import {
  setTextFilterAction,
  addKeywordFilterAction,
  setSearchTermsAction,
  addLocationFilterAction,
  removeLocationFilterAction,
  addGroupFilterAction,
  removeGroupFilterAction,
  removeKeywordFilterAction,
  addTypeFilterAction,
  removeTypeFilterAction,
  setDateRangeFilterAction,
  clearFacetsAction,
  addScientificConditionAction,
  removeScientificConditionAction,
} from "state-management/actions/datasets.actions";
import { combineLatest, BehaviorSubject, Observable, Subscription } from "rxjs";
import {
  selectColumnAction,
  deselectColumnAction,
  deselectAllCustomColumnsAction,
} from "state-management/actions/user.actions";
import { ScientificCondition } from "state-management/models";
import { SearchParametersDialogComponent } from "shared/modules/search-parameters-dialog/search-parameters-dialog.component";
import { AsyncPipe } from "@angular/common";
import { MatDatepickerInputEvent } from "@angular/material/datepicker";
import { DateTime } from "luxon";

interface DateRange {
  begin: string;
  end: string;
}
@Component({
  selector: "datasets-filter",
  templateUrl: "datasets-filter.component.html",
  styleUrls: ["datasets-filter.component.scss"],
})
export class DatasetsFilterComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  locationFacetCounts$ = this.store.pipe(select(getLocationFacetCounts));
  groupFacetCounts$ = this.store.pipe(select(getGroupFacetCounts));
  typeFacetCounts$ = this.store.pipe(select(getTypeFacetCounts));
  keywordFacetCounts$ = this.store.pipe(select(getKeywordFacetCounts));

  searchTerms$ = this.store.pipe(select(getSearchTerms));
  keywordsTerms$ = this.store.pipe(select(getKeywordsTerms));
  locationFilter$ = this.store.pipe(select(getLocationFilter));
  groupFilter$ = this.store.pipe(select(getGroupFilter));
  typeFilter$ = this.store.pipe(select(getTypeFilter));
  keywordsFilter$ = this.store.pipe(select(getKeywordsFilter));
  creationTimeFilter$ = this.store.pipe(select(getCreationTimeFilter));
  scientificConditions$ = this.store.pipe(select(getScientificConditions));
  metadataKeys$ = this.store.pipe(select(getMetadataKeys));

  locationInput$ = new BehaviorSubject<string>("");
  groupInput$ = new BehaviorSubject<string>("");
  typeInput$ = new BehaviorSubject<string>("");
  keywordsInput$ = new BehaviorSubject<string>("");

  clearSearchBar = false;
  groupSuggestions$ = this.createSuggestionObserver(
    this.groupFacetCounts$,
    this.groupInput$,
    this.groupFilter$
  );

  locationSuggestions$ = this.createSuggestionObserver(
    this.locationFacetCounts$,
    this.locationInput$,
    this.locationFilter$
  );

  typeSuggestions$ = this.createSuggestionObserver(
    this.typeFacetCounts$,
    this.typeInput$,
    this.typeFilter$
  );

  keywordsSuggestions$ = this.createSuggestionObserver(
    this.keywordFacetCounts$,
    this.keywordsInput$,
    this.keywordsFilter$
  );

  hasAppliedFilters$ = this.store.pipe(select(getHasAppliedFilters));

  dateRange: DateRange = {
    begin: "",
    end: "",
  };

  constructor(
    private asyncPipe: AsyncPipe,
    public dialog: MatDialog,
    private store: Store<any>,
    @Inject(APP_CONFIG) public appConfig: AppConfig
  ) {}

  createSuggestionObserver(
    facetCounts$: Observable<FacetCount[]>,
    input$: BehaviorSubject<string>,
    currentFilters$: Observable<string[]>
  ): Observable<FacetCount[]> {
    return combineLatest([facetCounts$, input$, currentFilters$]).pipe(
      map(([counts, filterString, currentFilters]) => {
        if (!counts) {
          return [];
        }
        return counts.filter(
          (count) =>
            typeof count._id === "string" &&
            count._id.toLowerCase().includes(filterString.toLowerCase()) &&
            currentFilters.indexOf(count._id) < 0
        );
      })
    );
  }

  getFacetId(facetCount: FacetCount, fallback = ""): string {
    const id = facetCount._id;
    return id ? String(id) : fallback;
  }

  getFacetCount(facetCount: FacetCount): number {
    return facetCount.count;
  }

  textSearchChanged(terms: string) {
    this.clearSearchBar = false;
    this.store.dispatch(setSearchTermsAction({ terms }));
  }

  onLocationInput(event: any) {
    const value = (<HTMLInputElement>event.target).value;
    this.locationInput$.next(value);
  }

  onGroupInput(event: any) {
    const value = (<HTMLInputElement>event.target).value;
    this.groupInput$.next(value);
  }

  onKeywordInput(event: any) {
    const value = (<HTMLInputElement>event.target).value;
    this.keywordsInput$.next(value);
  }

  onTypeInput(event: any) {
    const value = (<HTMLInputElement>event.target).value;
    this.typeInput$.next(value);
  }

  locationSelected(location: string | null) {
    const loc = location || "";
    this.store.dispatch(addLocationFilterAction({ location: loc }));
    this.locationInput$.next("");
  }

  locationRemoved(location: string) {
    this.store.dispatch(removeLocationFilterAction({ location }));
  }

  groupSelected(group: string) {
    this.store.dispatch(addGroupFilterAction({ group }));
    this.groupInput$.next("");
  }

  groupRemoved(group: string) {
    this.store.dispatch(removeGroupFilterAction({ group }));
  }

  keywordSelected(keyword: string) {
    this.store.dispatch(addKeywordFilterAction({ keyword }));
    this.keywordsInput$.next("");
  }

  keywordRemoved(keyword: string) {
    this.store.dispatch(removeKeywordFilterAction({ keyword }));
  }

  typeSelected(type: string) {
    this.store.dispatch(addTypeFilterAction({ datasetType: type }));
    this.typeInput$.next("");
  }

  typeRemoved(type: string) {
    this.store.dispatch(removeTypeFilterAction({ datasetType: type }));
  }

  dateChanged(event: MatDatepickerInputEvent<DateTime>) {
    if (event.value) {
      const name = event.targetElement.getAttribute("name");
      if (name === "begin") {
        this.dateRange.begin = event.value.toUTC().toISO();
        this.dateRange.end = "";
      }
      if (name === "end") {
        this.dateRange.end = event.value.toUTC().plus({ days: 1 }).toISO();
      }
      if (this.dateRange.begin.length > 0 && this.dateRange.end.length > 0) {
        this.store.dispatch(setDateRangeFilterAction(this.dateRange));
      }
    } else {
      this.store.dispatch(setDateRangeFilterAction({ begin: "", end: "" }));
    }
  }

  clearFacets() {
    this.clearSearchBar = true;
    this.dateRange = {
      begin: "",
      end: "",
    };
    this.store.dispatch(clearFacetsAction());
    this.store.dispatch(deselectAllCustomColumnsAction());
  }

  showAddConditionDialog() {
    this.dialog
      .open(SearchParametersDialogComponent, {
        data: { parameterKeys: this.asyncPipe.transform(this.metadataKeys$) },
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const { data } = res;
          this.store.dispatch(
            addScientificConditionAction({ condition: data })
          );
          this.store.dispatch(
            selectColumnAction({ name: data.lhs, columnType: "custom" })
          );
        }
      });
  }

  removeCondition(condition: ScientificCondition, index: number) {
    this.store.dispatch(removeScientificConditionAction({ index }));
    this.store.dispatch(
      deselectColumnAction({ name: condition.lhs, columnType: "custom" })
    );
  }

  ngOnInit() {
    this.subscriptions.push(
      this.searchTerms$
        .pipe(
          skipWhile((terms) => terms === ""),
          debounceTime(500),
          distinctUntilChanged()
        )
        .subscribe((terms) => {
          this.store.dispatch(setTextFilterAction({ text: terms }));
        })
    );

    this.subscriptions.push(
      this.keywordsTerms$
        .pipe(
          skipWhile((terms) => terms === ""),
          debounceTime(500),
          distinctUntilChanged()
        )
        .subscribe((terms) => {
          this.store.dispatch(addKeywordFilterAction({ keyword: terms }));
        })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
