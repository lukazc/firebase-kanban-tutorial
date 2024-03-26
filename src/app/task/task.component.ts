import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task } from './task.model';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

const MATERIAL = [
    MatCardModule,
]

@Component({
    selector: 'app-task',
    standalone: true,
    imports: [
        CommonModule,
        ...MATERIAL
    ],
    templateUrl: './task.component.html',
    styleUrl: './task.component.scss'
})
export class TaskComponent {
    @Input() task: Task | null = null;
    @Output() edit = new EventEmitter<Task>();
}
