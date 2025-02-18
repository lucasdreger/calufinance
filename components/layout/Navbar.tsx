import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './components/Home';
import About from './components/About';
import Contact from './components/Contact';
import fixed_expense_plan from './components/fixed_expense_plan';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
  { name: 'Fixed Expense Plans', href: '/budget-plans' },
];

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            {navigation.map((item) => (
              <li key={item.name}>
                <a href={item.href}>{item.name}</a>
              </li>
            ))}
          </ul>
        </nav>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/budget-plans" component={fixed_expense_plan} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
