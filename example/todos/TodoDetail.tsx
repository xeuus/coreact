
import React, { PureComponent } from 'react';
import { Autowired, Observer } from '../../src';
import { TodoService } from './TodoService';

@Observer([TodoService])
export class TodoDetail extends PureComponent{
  todoService = Autowired(TodoService, this);

  render(){
    return <div>
      {this.todoService.selectedDetail ? <h1>{this.todoService.selectedDetail.message}</h1> : <h1>not found</h1>}
    </div>
  }
}

