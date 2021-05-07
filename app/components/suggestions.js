import Component from '@glimmer/component';
import { action } from '@ember/object';

// ! Hardcoded for MVP
const QUESTIONS = [
  '"test-question-1"',
  '"something-question-2"',
  '"else-question-3"',
];
const ANSWERS = {
  'test-question-1': ['"yes"', '"no"'],
  'something-question-2': ['"1"', '"2"', '"3"'],
  'else-question-3': ['"maybe?"'],
};
const COMPARATORS = ['==', '!=', '&&', '!='];

export default class SuggestionsComponent extends Component {
  slug;

  get filteredQuestions() {
    const matches = this.args.jexlExpression.match(/[\w-]+$/g);
    if (matches) {
      this.slug = matches[0]; // ! not sure how to do this in ember
    }

    if (!this.slug) {
      return QUESTIONS;
    }
    return QUESTIONS.filter((question) => question.includes(this.slug));
  }

  get suggestions() {
    if (!this.args.ast) {
      return this.filteredQuestions;
    }

    const lastOperationIsAComparator = COMPARATORS.includes(
      this.args.jexlExpression.slice(-2)
    );
    if (lastOperationIsAComparator) {
      return this.fetchPossibleAnswers();
    }

    if (this.args.ast.type === 'BinaryExpression') {
      if (this.args.ast.right.type === 'Literal') {
        return COMPARATORS;
      }
      if (this.args.ast.right.type === 'Identifier') {
        return this.filteredQuestions;
      }
      return COMPARATORS;
    }
    if (this.args.ast.type === 'FunctionCall') {
      return COMPARATORS;
    }

    if (this.args.ast.type === 'Identifier') {
      return this.filteredQuestions;
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

    this.args.onSelection(jexlToAppend, this.slug);
    this.slug = null;
  }

  appendAnswerTransformIfRequired(jexlToAppend) {
    if (QUESTIONS.includes(jexlToAppend)) {
      return (jexlToAppend += '|answer');
    }
    return jexlToAppend;
  }
}
