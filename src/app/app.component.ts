import { CdkDragDrop, DragDropModule, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, query, runTransaction, updateDoc } from '@angular/fire/firestore';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { TaskDialogComponent, TaskDialogResult } from './task-dialog/task-dialog.component';
import { TaskComponent } from './task/task.component';
import { Task } from './task/task.model';

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
        this.todo = this.getObservable('todo');
        this.inProgress = this.getObservable('inProgress');
        this.done = this.getObservable('done');
    }

    private getObservable = (collectionPath: string) => {
        const subject = new BehaviorSubject<Task[]>([]);
        (collectionData(query(collection(this.firestore, collectionPath)), { idField: 'id' }) as Observable<Task[]>).subscribe((tasks) => subject.next(tasks));
        return subject;
    };

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
                updateDoc(doc(this.firestore, list, task.id as string), { ...result.task });
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
