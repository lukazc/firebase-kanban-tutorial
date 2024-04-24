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
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, query, runTransaction, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

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

    todo: Observable<Task[]>;
    inProgress: Observable<Task[]>;
    done: Observable<Task[]>;

    constructor(
        private dialog: MatDialog,
        private firestore: Firestore
    ) {
        this.todo = collectionData(query(collection(this.firestore, 'todo')), { idField: 'id' }) as Observable<Task[]>;
        this.inProgress = collectionData(query(collection(this.firestore, 'inProgress')), { idField: 'id' }) as Observable<Task[]>;
        this.done = collectionData(query(collection(this.firestore, 'done')), { idField: 'id' }) as Observable<Task[]>;
    }

    editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
        const dialogRef = this.dialog.open(TaskDialogComponent, {
            width: '270px',
            data: {
                task,
                enableDelete: true,
            },
        });
        dialogRef.afterClosed().subscribe((result: TaskDialogResult | undefined) => {
            if (!result) {
                return;
            }
            if (result.delete) {
                deleteDoc(doc(this.firestore, list, task.id as string));
            } else {
                updateDoc(doc(this.firestore, list, task.id as string), {...result.task});
            }
        });
    }

    drop(event: CdkDragDrop<Task[] | null>): void {
        if (event.previousContainer === event.container) {
            // TODO: update the order of the tasks
            // moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
            return;
        }
        if (!event.container.data || !event.previousContainer.data) {
            return;
        }
        const item = event.previousContainer.data[event.previousIndex];
        if (event.previousContainer.id) {
            runTransaction(this.firestore, () => {
                const promise = Promise.all([
                    deleteDoc(doc(this.firestore, event.previousContainer.id, item.id as string)),
                    addDoc(collection(this.firestore, event.container.id), item)
                ]);
                return promise;
            });
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
                addDoc(collection(this.firestore, 'todo'), result.task);
            });
    }
}
