import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Task } from './task/task.model';
import { TaskComponent } from './task/task.component';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskDialogComponent, TaskDialogResult } from './task-dialog/task-dialog.component';

const MATERIAL = [
    MatIconModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule
]

const COMPONENTS = [TaskComponent];

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,
        DragDropModule,
        ...MATERIAL,
        ...COMPONENTS
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
    title = 'firebase-kanban';
    todo: Task[] = [
        {
            title: 'Buy milk',
            description: 'Go to the store and buy milk'
        },
        {
            title: 'Create a Kanban app',
            description: 'Using Firebase and Angular create a Kanban app!'
        }
    ];
    inProgress: Task[] = [];
    done: Task[] = [];

    constructor(
        private dialog: MatDialog
    ) { }

    editTask(list: string, task: Task): void { }

    drop(event: CdkDragDrop<Task[]>): void {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
            return;
        }
        if (!event.container.data || !event.previousContainer.data) {
            return;
        }
        transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
        );
    }

    newTask(): void {
        const dialogRef = this.dialog.open(TaskDialogComponent, {
            width: '270px',
            data: {
                task: {},
            },
        });
        dialogRef
            .afterClosed()
            .subscribe((result: TaskDialogResult | undefined) => {
                if (!result) {
                    return;
                }
                this.todo.push(result.task);
            });
    }
}
