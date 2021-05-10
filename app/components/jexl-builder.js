import Component from '@glimmer/component';
import jexl from 'jexl';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

const transforms = [
  { answer: (questions) => questions.map((question) => question) },
];

Object.entries(transforms).map(([key, transform]) => {
  jexl.addTransform(key, transform);
});

export default class JexlBuilderComponent extends Component {
  @tracked jexlExpression = ''; // ! not sure how to do this
  @tracked astIsInvalid = false;
  lastSuccessfulAst;
  htmlElement;

  get ast() {
    try {
      const result = jexl.createExpression(this.jexlExpression)._getAst();
      this.lastSuccessfulAst = result; // ! not sure how to do this
      return result;
    } catch (e) {
      return this.lastSuccessfulAst;
    }
  }

  @action
  setElementRef(element) {
    this.htmlElement = element;
  }

  focusTextArea() {
    this.htmlElement.focus();
    this.htmlElement.setSelectionRange(
      this.jexlExpression.length,
      this.jexlExpression.length
    );
  }

  @action
  evaluateAst() {
    // jexl.createExpression(this.jexlExpression)._getAst();
    // return this.ast;
    try {
      const result = jexl.createExpression(this.jexlExpression)._getAst();
      this.astIsInvalid = false;
      this.lastSuccessfulAst = result; // ! not sure how to do this
    } catch (e) {
      this.astIsInvalid = true;
    }
  }

  @action
  suggestionSelected(selection, slug) {
    if (slug && slug !== '') {
      // this.jexlExpression = this.jexlExpression.replace(slug, ''); // !TODO Replace last match for this!
      debugger;
      this.jexlExpression = this.jexlExpression.replace(
        new RegExp(slug + '$'),
        ''
      ); // !TODO Replace last match for this!
    }

    this.jexlExpression += ' ' + selection;
    // this.evaluateAst();
    this.focusTextArea();
  }

  @action
  pickFirstSuggestion() {
    console.log("🦠 'in here':", 'in here');
  }
}
