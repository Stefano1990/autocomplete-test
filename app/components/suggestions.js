import Component from '@glimmer/component';
import { action } from '@ember/object';

// ! Hardcoded for MVP
const QUESTIONS = ['"question-1"', '"question-2"', '"question-3"'];
const ANSWERS = {
  'question-1': ['"yes"', '"no"'],
  'question-2': ['"1"', '"2"', '"3"'],
  'question-3': ['"maybe?"'],
};
const COMPARATORS = ['==', '!=', '&&', '!='];

export default class SuggestionsComponent extends Component {
  get suggestions() {
    if (!this.args.ast) {
      return [...QUESTIONS];
    }

    const lastOperationIsAComparator = COMPARATORS.includes(
      this.args.jexlExpression.slice(-2)
    );
    if (lastOperationIsAComparator) {
      return this.fetchPossibleAnswers();
    }

    if (this.args.ast.type === 'BinaryExpression') {
      return COMPARATORS;
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
    const ast = this.args.ast;

    if (ast.type === 'FunctionCall') {
      const lastArg = ast.args[ast.args.length - 1];
      if (lastArg.type === 'Literal') {
        return ANSWERS[lastArg.value];
      }
    }

    if (ast.type === 'BinaryExpression') {
      if (ast.right.args) {
        return ANSWERS[ast.right.args[0].value];
      }
    }

    return this.fetchQuestions();
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
