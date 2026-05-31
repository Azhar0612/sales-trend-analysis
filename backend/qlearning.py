import numpy as np

def q_learning_prediction(sales):

    states = len(sales)
    actions = 2

    Q = np.zeros((states, actions))

    alpha = 0.1
    gamma = 0.9
    epsilon = 0.1

    for episode in range(500):

        state = np.random.randint(0, states-1)

        for step in range(10):

            if np.random.rand() < epsilon:
                action = np.random.randint(actions)
            else:
                action = np.argmax(Q[state])

            reward = sales[state]

            next_state = (state + 1) % states

            Q[state, action] += alpha * (
                reward + gamma * np.max(Q[next_state]) - Q[state, action]
            )

            state = next_state

    prediction = np.mean(Q)

    return round(prediction, 2)