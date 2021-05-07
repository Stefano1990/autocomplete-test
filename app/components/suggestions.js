import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

// ! Hardcoded for MVP
const QUESTIONS = ['"question-1"', '"question-2"', '"question-3"'];
const ANSWERS = {
  'question-1': ['yes', 'no'],
  'question-2': ['1', '2', '3'],
  'question-3': ['maybe?'],
};
const COMPARATORS = ['==', '!=', '&&', '!='];

export default class SuggestionsComponent extends Component {
  get suggestions() {
    console.log('🦠 this.ast 1:', this.args.ast);

    const lastOperationIsAComparator = COMPARATORS.includes(
      this.args.jexlExpression.slice(-2)
    );
    if (lastOperationIsAComparator) {
      return this.fetchPossibleAnswers();
    }

    if (this.args.ast.type === 'BinaryExpression') {
      return [...QUESTIONS, ...COMPARATORS];
    }
    if (this.args.ast.type === 'FunctionCall') {
      return COMPARATORS;
    }

    return QUESTIONS;
  }

  fetchQuestions = function () {
    return QUESTIONS;
  };

  fetchPossibleAnswers = function () {
    const regExp = /".*?"/g;
    let foundQuestions = this.args.jexlExpression.match(regExp);
    const lastQuestion = foundQuestions[foundQuestions.length];
    if (lastQuestion) {
      return ANSWERS[JSON.parse(lastQuestion)];
    } else {
      this.fetchQuestions();
    }
  };

  @action
  select(suggestion) {
    const jexlToAppend = this.appendAnswerTransformIfRequired(suggestion);

    this.args.onSelection(jexlToAppend);
  }

  appendAnswerTransformIfRequired(jexlToAppend) {
    if (QUESTIONS.includes(jexlToAppend)) {
      return (jexlToAppend += '|answer');
    }
    return jexlToAppend;
  }
}
